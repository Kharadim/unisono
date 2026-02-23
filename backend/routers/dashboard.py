from fastapi import APIRouter
from datetime import date, datetime
from backend.database import get_db

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard/stats")
def dashboard_stats():
    db = get_db()

    # Last JF per employee
    last_jf = db.execute(
        """SELECT employee_id, MAX(completed_at) as last_jf, mood
           FROM jourfix_sessions
           WHERE completed_at IS NOT NULL
           GROUP BY employee_id"""
    ).fetchall()
    last_jf_map = {r["employee_id"]: {"last_jf": r["last_jf"], "mood": r["mood"]} for r in last_jf}

    # Get mood from the actual last session (the GROUP BY above may not get the right mood)
    for emp_id in last_jf_map:
        row = db.execute(
            """SELECT mood FROM jourfix_sessions
               WHERE employee_id = ? AND completed_at IS NOT NULL
               ORDER BY completed_at DESC LIMIT 1""",
            (emp_id,),
        ).fetchone()
        if row:
            last_jf_map[emp_id]["mood"] = row["mood"]

    # Overdue agreements with details
    overdue_rows = db.execute(
        """SELECT a.id, a.employee_id, e.name as employee_name, a.content, a.due_date,
                  a.project_id, p.name as project_name
           FROM agreements a
           JOIN employees e ON e.id = a.employee_id
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.status = 'offen' AND a.due_date IS NOT NULL AND a.due_date != '' AND a.due_date < date('now')
           ORDER BY a.due_date ASC"""
    ).fetchall()
    overdue_list = [dict(r) for r in overdue_rows]

    # Total open agreements
    open_agreements = db.execute(
        "SELECT COUNT(*) as cnt FROM agreements WHERE status = 'offen'"
    ).fetchone()["cnt"]

    db.close()
    return {
        "last_jf_per_employee": last_jf_map,
        "overdue_agreements": len(overdue_list),
        "overdue_agreement_details": overdue_list,
        "open_agreements": open_agreements,
    }


@router.get("/api/dashboard/attention")
def attention_radar():
    db = get_db()
    today = date.today().isoformat()

    employees = db.execute("SELECT id, name, photo_path FROM employees").fetchall()

    result = []
    for emp in employees:
        eid = emp["id"]
        score = 0
        signals = []

        # 1. JF discipline
        last_jf_row = db.execute(
            """SELECT completed_at FROM jourfix_sessions
               WHERE employee_id = ? AND completed_at IS NOT NULL
               ORDER BY completed_at DESC LIMIT 1""",
            (eid,),
        ).fetchone()

        if not last_jf_row:
            score += 5
            signals.append("Noch nie ein JF gehabt")
        else:
            last_jf_date = datetime.fromisoformat(last_jf_row["completed_at"]).date()
            days_since = (date.today() - last_jf_date).days
            if days_since > 28:
                score += 4
                signals.append(f"Kein JF seit {days_since} Tagen")
            elif days_since > 14:
                score += 2
                signals.append(f"Kein JF seit {days_since} Tagen")

        # 2. Mood — last session
        last_mood_row = db.execute(
            """SELECT mood FROM jourfix_sessions
               WHERE employee_id = ? AND completed_at IS NOT NULL AND mood IS NOT NULL
               ORDER BY completed_at DESC LIMIT 1""",
            (eid,),
        ).fetchone()
        if last_mood_row and last_mood_row["mood"] is not None and last_mood_row["mood"] <= 2:
            score += 3
            mood_labels = {1: "Schlecht", 2: "Eher schlecht"}
            signals.append(f"Stimmung: {mood_labels.get(last_mood_row['mood'], '?')}")

        # 3. Mood falling (last 3 JFs)
        mood_rows = db.execute(
            """SELECT mood FROM jourfix_sessions
               WHERE employee_id = ? AND completed_at IS NOT NULL AND mood IS NOT NULL
               ORDER BY completed_at DESC LIMIT 3""",
            (eid,),
        ).fetchall()
        if len(mood_rows) >= 3:
            moods = [r["mood"] for r in mood_rows]  # newest first
            if moods[0] < moods[1] < moods[2]:
                score += 2
                signals.append("Stimmung sinkt seit 3 JFs")

        # 4. Overdue agreements
        overdue_count = db.execute(
            """SELECT COUNT(*) as cnt FROM agreements
               WHERE employee_id = ? AND status = 'offen'
               AND due_date IS NOT NULL AND due_date != '' AND due_date < ?""",
            (eid, today),
        ).fetchone()["cnt"]
        if overdue_count > 0:
            score += 2 * overdue_count
            signals.append(f"{overdue_count} Vereinbarung{'en' if overdue_count > 1 else ''} überfällig")

        # 5. Overdue milestones (via project membership)
        overdue_ms = db.execute(
            """SELECT COUNT(*) as cnt FROM milestones m
               JOIN project_members pm ON pm.project_id = m.project_id
               WHERE pm.employee_id = ? AND m.status != 'done'
               AND m.due_date IS NOT NULL AND m.due_date != '' AND m.due_date < ?""",
            (eid, today),
        ).fetchone()["cnt"]
        if overdue_ms > 0:
            score += 1 * overdue_ms
            signals.append(f"{overdue_ms} Milestone{'s' if overdue_ms > 1 else ''} überfällig")

        # 6. No development plan
        has_devplan = db.execute(
            "SELECT COUNT(*) as cnt FROM development_plans WHERE employee_id = ?",
            (eid,),
        ).fetchone()["cnt"]
        if has_devplan == 0:
            score += 1
            signals.append("Kein Entwicklungsplan")

        # 7. STEPs not done (current year, no performance_rating)
        current_year = str(date.today().year)
        steps_plan = db.execute(
            """SELECT performance_rating FROM development_plans
               WHERE employee_id = ? AND period = ?
               ORDER BY created_at DESC LIMIT 1""",
            (eid, current_year),
        ).fetchone()
        if has_devplan > 0 and (not steps_plan or not steps_plan["performance_rating"]):
            score += 1
            signals.append("STEPs-Gespräch offen")

        # 8. Overdue development measures
        overdue_measures = db.execute(
            """SELECT COUNT(*) as cnt FROM dev_measures dm
               JOIN dev_areas da ON da.id = dm.area_id
               JOIN development_plans dp ON dp.id = da.plan_id
               WHERE dp.employee_id = ? AND dm.status != 'erledigt'
               AND dm.due_date IS NOT NULL AND dm.due_date != '' AND dm.due_date < ?""",
            (eid, today),
        ).fetchone()["cnt"]
        if overdue_measures > 0:
            score += 1 * overdue_measures
            signals.append(f"{overdue_measures} Massnahme{'n' if overdue_measures > 1 else ''} überfällig")

        if score > 0:
            result.append({
                "employee_id": eid,
                "employee_name": emp["name"],
                "photo_path": emp["photo_path"],
                "score": score,
                "signals": signals,
            })

    db.close()

    # Sort by score descending
    result.sort(key=lambda x: x["score"], reverse=True)
    return result
