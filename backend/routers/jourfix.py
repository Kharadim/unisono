from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import JourFixComplete

router = APIRouter(tags=["jourfix"])


def _load_session_data(db, employee_id: int) -> dict:
    """Load projects, goals, and devplan for an employee's JF session."""
    projects = db.execute(
        """SELECT p.* FROM projects p
           JOIN project_members pm ON pm.project_id = p.id
           WHERE pm.employee_id = ? AND p.status != 'abgeschlossen'
           ORDER BY p.name""",
        (employee_id,),
    ).fetchall()

    result_projects = []
    for p in projects:
        proj = dict(p)
        milestones = db.execute(
            "SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order, id",
            (p["id"],),
        ).fetchall()
        proj["milestones"] = [dict(m) for m in milestones]

        kpis = db.execute(
            "SELECT * FROM kpis WHERE project_id = ? ORDER BY sort_order, id",
            (p["id"],),
        ).fetchall()
        proj["kpis"] = [dict(k) for k in kpis]
        result_projects.append(proj)

    goals = db.execute(
        """SELECT * FROM goals
           WHERE employee_id = ? AND status IN ('offen', 'in_arbeit')
           ORDER BY period DESC, created_at DESC""",
        (employee_id,),
    ).fetchall()

    devplan_row = db.execute(
        """SELECT * FROM development_plans
           WHERE employee_id = ? ORDER BY period DESC, created_at DESC LIMIT 1""",
        (employee_id,),
    ).fetchone()

    devplan = None
    if devplan_row:
        devplan = dict(devplan_row)
        strengths = db.execute(
            "SELECT * FROM dev_strengths WHERE plan_id = ? ORDER BY sort_order, id",
            (devplan_row["id"],),
        ).fetchall()
        devplan["strengths"] = [dict(s) for s in strengths]

        areas = db.execute(
            "SELECT * FROM dev_areas WHERE plan_id = ? ORDER BY sort_order, id",
            (devplan_row["id"],),
        ).fetchall()
        area_list = []
        for a in areas:
            area = dict(a)
            measures = db.execute(
                "SELECT * FROM dev_measures WHERE area_id = ? ORDER BY created_at, id",
                (a["id"],),
            ).fetchall()
            area["measures"] = [dict(m) for m in measures]
            area_list.append(area)
        devplan["areas"] = area_list

        trainings = db.execute(
            "SELECT * FROM dev_trainings WHERE plan_id = ? ORDER BY sort_order, id",
            (devplan_row["id"],),
        ).fetchall()
        devplan["trainings"] = [dict(t) for t in trainings]

    agreements = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.status = 'offen'
           ORDER BY a.due_date IS NULL, a.due_date, a.created_at""",
        (employee_id,),
    ).fetchall()

    return {
        "projects": result_projects,
        "goals": [dict(g) for g in goals],
        "devplan": devplan,
        "agreements": [dict(a) for a in agreements],
    }


@router.post("/api/employees/{employee_id}/jourfix", status_code=201)
def start_jourfix(employee_id: int):
    db = get_db()
    emp = db.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not emp:
        db.close()
        raise HTTPException(404, "Employee not found")

    cur = db.execute(
        "INSERT INTO jourfix_sessions (employee_id) VALUES (?)",
        (employee_id,),
    )
    session_id = cur.lastrowid
    db.commit()

    data = _load_session_data(db, employee_id)
    db.close()
    return {
        "session_id": session_id,
        "employee_id": employee_id,
        **data,
    }


@router.post("/api/jourfix/{session_id}/resume")
def resume_jourfix(session_id: int):
    db = get_db()
    session = db.execute(
        "SELECT * FROM jourfix_sessions WHERE id = ? AND completed_at IS NULL",
        (session_id,),
    ).fetchone()
    if not session:
        db.close()
        raise HTTPException(404, "Open session not found")

    employee_id = session["employee_id"]
    data = _load_session_data(db, employee_id)
    db.close()
    return {
        "session_id": session_id,
        "employee_id": employee_id,
        **data,
    }


@router.get("/api/employees/{employee_id}/jourfix/open")
def get_open_jourfix(employee_id: int):
    db = get_db()
    row = db.execute(
        """SELECT * FROM jourfix_sessions
           WHERE employee_id = ? AND completed_at IS NULL
           ORDER BY started_at DESC LIMIT 1""",
        (employee_id,),
    ).fetchone()
    db.close()
    if not row:
        return {"has_open": False}
    return {"has_open": True, "session": dict(row)}


@router.post("/api/jourfix/{session_id}/complete")
def complete_jourfix(session_id: int, data: JourFixComplete):
    db = get_db()
    session = db.execute(
        "SELECT * FROM jourfix_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if not session:
        db.close()
        raise HTTPException(404, "Session not found")
    if session["completed_at"]:
        db.close()
        raise HTTPException(400, "Session already completed")

    try:
        # Apply all changes in one transaction

        # 1. Milestone changes (status + name/due_date edits)
        for mc in data.milestone_changes:
            old = db.execute("SELECT status, name, due_date FROM milestones WHERE id = ?", (mc["id"],)).fetchone()
            if not old:
                continue
            updates = []
            params = []
            # Status change
            if "status" in mc and mc["status"] != old["status"]:
                updates.append("status = ?")
                params.append(mc["status"])
                if mc["status"] == "done":
                    updates.append("completed_at = datetime('now')")
                else:
                    updates.append("completed_at = NULL")
            # Name change
            if "name" in mc and mc["name"] != old["name"]:
                updates.append("name = ?")
                params.append(mc["name"])
            # Due date change
            if "due_date" in mc and mc["due_date"] != (old["due_date"] or ""):
                updates.append("due_date = ?")
                params.append(mc["due_date"] or None)
            if updates:
                params.append(mc["id"])
                db.execute(f"UPDATE milestones SET {', '.join(updates)} WHERE id = ?", params)

        # 2. KPI changes (with history tracking)
        for kc in data.kpi_changes:
            old = db.execute("SELECT value, unit FROM kpis WHERE id = ?", (kc["id"],)).fetchone()
            updates = []
            params = []
            if "value" in kc:
                updates.append("value = ?")
                params.append(kc["value"])
            if "unit" in kc:
                updates.append("unit = ?")
                params.append(kc["unit"])
            if updates:
                params.append(kc["id"])
                db.execute(f"UPDATE kpis SET {', '.join(updates)} WHERE id = ?", params)
                # Track history
                if old:
                    new_value = kc.get("value", old["value"])
                    new_unit = kc.get("unit", old["unit"])
                    if new_value != old["value"] or new_unit != old["unit"]:
                        db.execute(
                            "INSERT INTO kpi_history (kpi_id, old_value, old_unit, new_value, new_unit) VALUES (?, ?, ?, ?, ?)",
                            (kc["id"], old["value"], old["unit"], new_value, new_unit),
                        )

        # 3. Project status changes
        for ps in data.project_status_changes:
            old = db.execute("SELECT status, status_text FROM projects WHERE id = ?", (ps["project_id"],)).fetchone()
            if old:
                if "status" in ps and ps["status"] != old["status"]:
                    db.execute(
                        "INSERT INTO status_history (project_id, field, old_value, new_value) VALUES (?, 'status', ?, ?)",
                        (ps["project_id"], old["status"], ps["status"]),
                    )
                    db.execute("UPDATE projects SET status = ? WHERE id = ?", (ps["status"], ps["project_id"]))
                if "status_text" in ps and ps["status_text"] != old["status_text"]:
                    db.execute(
                        "INSERT INTO status_history (project_id, field, old_value, new_value) VALUES (?, 'status_text', ?, ?)",
                        (ps["project_id"], old["status_text"], ps["status_text"]),
                    )
                    db.execute("UPDATE projects SET status_text = ? WHERE id = ?", (ps["status_text"], ps["project_id"]))

        # 4. New milestones
        for nm in data.new_milestones:
            db.execute(
                "INSERT INTO milestones (project_id, name, due_date, status) VALUES (?, ?, ?, ?)",
                (nm["project_id"], nm["name"], nm.get("due_date"), nm.get("status", "offen")),
            )

        # 5. New KPIs
        for nk in data.new_kpis:
            db.execute(
                "INSERT INTO kpis (project_id, label, value, unit) VALUES (?, ?, ?, ?)",
                (nk["project_id"], nk["label"], nk.get("value", ""), nk.get("unit", "")),
            )

        # 6. Project notes (with tags)
        for pn in data.project_notes:
            if pn.get("notes", "").strip():
                db.execute(
                    "INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags) VALUES (?, ?, ?, ?)",
                    (session_id, pn["project_id"], pn["notes"], pn.get("tags", "")),
                )

        # 7. General notes → store as note (with tags)
        if data.general_notes.strip():
            employee_id = session["employee_id"]
            db.execute(
                "INSERT INTO notes (employee_id, content, type, jourfix_id, tags) VALUES (?, ?, 'jourfix', ?, ?)",
                (employee_id, data.general_notes, session_id, data.general_notes_tags),
            )

        # 8. New agreements
        employee_id = session["employee_id"]
        for ag in data.new_agreements:
            if ag.get("content", "").strip():
                db.execute(
                    "INSERT INTO agreements (employee_id, content, project_id, due_date, jourfix_id) VALUES (?, ?, ?, ?, ?)",
                    (employee_id, ag["content"], ag.get("project_id"), ag.get("due_date"), session_id),
                )

        # 9. Goal status changes
        for gc in data.goal_changes:
            old = db.execute("SELECT status FROM goals WHERE id = ?", (gc["id"],)).fetchone()
            if old and old["status"] != gc["status"]:
                completed_at_sql = "datetime('now')" if gc["status"] in ('erreicht', 'nicht_erreicht') else "NULL"
                db.execute(
                    f"UPDATE goals SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
                    (gc["status"], gc["id"]),
                )

        # 10. Agreement status changes
        for ac in data.agreement_changes:
            old = db.execute("SELECT status FROM agreements WHERE id = ?", (ac["id"],)).fetchone()
            if old and old["status"] != ac["status"]:
                completed_at_sql = "datetime('now')" if ac["status"] == "erledigt" else "NULL"
                db.execute(
                    f"UPDATE agreements SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
                    (ac["status"], ac["id"]),
                )

        # 11. Development plan measure status changes
        for mc in data.measure_changes:
            old = db.execute("SELECT status FROM dev_measures WHERE id = ?", (mc["id"],)).fetchone()
            if old and old["status"] != mc["status"]:
                completed_at_sql = "datetime('now')" if mc["status"] == "erledigt" else "NULL"
                db.execute(
                    f"UPDATE dev_measures SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
                    (mc["status"], mc["id"]),
                )

        # 12. Training status changes
        for tc in data.training_changes:
            old = db.execute("SELECT status FROM dev_trainings WHERE id = ?", (tc["id"],)).fetchone()
            if old and old["status"] != tc["status"]:
                completed_at_sql = "datetime('now')" if tc["status"] == "abgeschlossen" else "NULL"
                db.execute(
                    f"UPDATE dev_trainings SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
                    (tc["status"], tc["id"]),
                )

        # 11. Complete session (with mood)
        db.execute(
            "UPDATE jourfix_sessions SET completed_at = datetime('now'), general_notes = ?, mood = ? WHERE id = ?",
            (data.general_notes, data.mood, session_id),
        )

        db.commit()
    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(500, f"Failed to apply changes: {str(e)}")

    db.close()
    return {"status": "completed", "session_id": session_id}


@router.delete("/api/jourfix/{session_id}", status_code=204)
def discard_jourfix(session_id: int):
    db = get_db()
    session = db.execute(
        "SELECT * FROM jourfix_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if not session:
        db.close()
        raise HTTPException(404, "Session not found")

    db.execute("DELETE FROM jourfix_sessions WHERE id = ?", (session_id,))
    db.commit()
    db.close()


@router.get("/api/jourfix/{session_id}/protocol")
def jourfix_protocol(session_id: int):
    db = get_db()
    session = db.execute(
        "SELECT * FROM jourfix_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if not session:
        db.close()
        raise HTTPException(404, "Session not found")

    # Employee info
    emp = db.execute(
        "SELECT id, name, role, department FROM employees WHERE id = ?",
        (session["employee_id"],),
    ).fetchone()

    mood_labels = {1: "Schlecht", 2: "Eher schlecht", 3: "Neutral", 4: "Gut", 5: "Sehr gut"}

    # Project notes
    pnotes = db.execute(
        """SELECT jpn.*, p.name as project_name
           FROM jourfix_project_notes jpn
           JOIN projects p ON p.id = jpn.project_id
           WHERE jpn.jourfix_id = ?""",
        (session_id,),
    ).fetchall()

    # Agreements created in this session
    agreements = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.jourfix_id = ?""",
        (session_id,),
    ).fetchall()

    # Goals at time of session (active goals for this employee)
    goals = db.execute(
        """SELECT * FROM goals
           WHERE employee_id = ?
           ORDER BY category, created_at DESC""",
        (session["employee_id"],),
    ).fetchall()

    # General notes from notes table (type=jourfix, jourfix_id=session_id)
    general_note = db.execute(
        """SELECT content, tags FROM notes
           WHERE jourfix_id = ? AND type = 'jourfix'
           LIMIT 1""",
        (session_id,),
    ).fetchone()

    # Development plan areas with active measures + STEPs data
    devplan_areas = []
    steps_summary = None
    devplan_trainings = []
    devplan_row = db.execute(
        """SELECT * FROM development_plans
           WHERE employee_id = ? ORDER BY period DESC, created_at DESC LIMIT 1""",
        (session["employee_id"],),
    ).fetchone()
    if devplan_row:
        areas = db.execute(
            "SELECT * FROM dev_areas WHERE plan_id = ? ORDER BY sort_order, id",
            (devplan_row["id"],),
        ).fetchall()
        for a in areas:
            measures = db.execute(
                "SELECT content, status, due_date FROM dev_measures WHERE area_id = ? ORDER BY created_at, id",
                (a["id"],),
            ).fetchall()
            active_measures = [dict(m) for m in measures if m["status"] in ('offen', 'in_arbeit')]
            if active_measures:
                devplan_areas.append({
                    "title": a["title"],
                    "priority": a["priority"],
                    "measures": active_measures,
                })

        # STEPs summary for protocol
        rating_labels = {
            'uebertroffen': 'Übertroffen',
            'voll': 'Voll erfüllt',
            'teilweise': 'Teilweise erfüllt',
            'unzureichend': 'Unzureichend',
        }
        talent_labels = {
            'vertikal': 'Vertikal',
            'horizontal': 'Horizontal',
            'kein_wert': 'Kein Wert',
        }
        if devplan_row["performance_rating"]:
            steps_summary = {
                "performance_rating": devplan_row["performance_rating"],
                "performance_label": rating_labels.get(devplan_row["performance_rating"], devplan_row["performance_rating"]),
                "talent_pool": devplan_row["talent_pool"],
                "talent_label": talent_labels.get(devplan_row["talent_pool"], devplan_row["talent_pool"]),
            }

        # Active trainings
        trainings = db.execute(
            "SELECT content, status, provider, cost, due_date FROM dev_trainings WHERE plan_id = ? AND status != 'abgeschlossen' ORDER BY sort_order, id",
            (devplan_row["id"],),
        ).fetchall()
        devplan_trainings = [dict(t) for t in trainings]

    db.close()
    return {
        "session_id": session_id,
        "employee_name": emp["name"] if emp else "Unbekannt",
        "employee_role": emp["role"] if emp else "",
        "employee_department": emp["department"] if emp else "",
        "started_at": session["started_at"],
        "completed_at": session["completed_at"],
        "mood": session["mood"],
        "mood_label": mood_labels.get(session["mood"], "") if session["mood"] else "",
        "general_notes": session["general_notes"] or "",
        "general_notes_tags": general_note["tags"] if general_note else "",
        "project_notes": [dict(pn) for pn in pnotes],
        "agreements_created": [dict(a) for a in agreements],
        "goals_at_time": [dict(g) for g in goals],
        "devplan_areas": devplan_areas,
        "steps_summary": steps_summary,
        "devplan_trainings": devplan_trainings,
    }


@router.get("/api/employees/{employee_id}/jourfix/recap")
def jourfix_recap(employee_id: int):
    db = get_db()
    # Find last completed JF for this employee
    last_jf = db.execute(
        """SELECT id, completed_at FROM jourfix_sessions
           WHERE employee_id = ? AND completed_at IS NOT NULL
           ORDER BY completed_at DESC LIMIT 1""",
        (employee_id,),
    ).fetchone()

    if not last_jf:
        db.close()
        return {
            "last_jf_date": None,
            "agreements_completed": [],
            "milestones_completed": [],
            "kpi_changes": [],
        }

    since = last_jf["completed_at"]

    # Agreements completed since last JF
    agreements_completed = db.execute(
        """SELECT a.content, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.status = 'erledigt' AND a.completed_at > ?
           ORDER BY a.completed_at DESC""",
        (employee_id, since),
    ).fetchall()

    # Get active project IDs for this employee
    project_ids = db.execute(
        """SELECT p.id FROM projects p
           JOIN project_members pm ON pm.project_id = p.id
           WHERE pm.employee_id = ? AND p.status != 'abgeschlossen'""",
        (employee_id,),
    ).fetchall()
    proj_ids = [r["id"] for r in project_ids]

    milestones_completed = []
    kpi_changes = []
    milestones_edited = []

    if proj_ids:
        placeholders = ",".join("?" for _ in proj_ids)

        # Milestones completed since last JF
        milestones_completed = db.execute(
            f"""SELECT m.name, p.name as project_name
                FROM milestones m
                JOIN projects p ON p.id = m.project_id
                WHERE m.project_id IN ({placeholders}) AND m.status = 'done' AND m.completed_at > ?
                ORDER BY m.completed_at DESC""",
            (*proj_ids, since),
        ).fetchall()

        # KPI changes since last JF
        kpi_changes = db.execute(
            f"""SELECT k.label, p.name as project_name,
                       kh.old_value, kh.old_unit, kh.new_value, kh.new_unit
                FROM kpi_history kh
                JOIN kpis k ON k.id = kh.kpi_id
                JOIN projects p ON p.id = k.project_id
                WHERE k.project_id IN ({placeholders}) AND kh.changed_at > ?
                ORDER BY kh.changed_at DESC""",
            (*proj_ids, since),
        ).fetchall()

        # Milestones edited since last JF (name/due_date changed outside JF)
        milestones_edited = db.execute(
            f"""SELECT m.name, p.name as project_name, m.due_date
                FROM milestones m
                JOIN projects p ON p.id = m.project_id
                WHERE m.project_id IN ({placeholders}) AND m.updated_at > ?
                ORDER BY m.updated_at DESC""",
            (*proj_ids, since),
        ).fetchall()

    # Agreements edited since last JF
    agreements_edited = db.execute(
        """SELECT a.content, p.name as project_name, a.due_date
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.updated_at > ?
           ORDER BY a.updated_at DESC""",
        (employee_id, since),
    ).fetchall()

    # Dev measures edited since last JF
    measures_edited = db.execute(
        """SELECT dm.content, da.title as area_title, dm.due_date
           FROM dev_measures dm
           JOIN dev_areas da ON da.id = dm.area_id
           JOIN development_plans dp ON dp.id = da.plan_id
           WHERE dp.employee_id = ? AND dm.updated_at > ?
           ORDER BY dm.updated_at DESC""",
        (employee_id, since),
    ).fetchall()

    db.close()
    return {
        "last_jf_date": since,
        "agreements_completed": [dict(a) for a in agreements_completed],
        "milestones_completed": [dict(m) for m in milestones_completed],
        "kpi_changes": [dict(k) for k in kpi_changes],
        "milestones_edited": [dict(m) for m in milestones_edited],
        "agreements_edited": [dict(a) for a in agreements_edited],
        "measures_edited": [dict(m) for m in measures_edited],
    }


@router.get("/api/employees/{employee_id}/jourfix-history")
def jourfix_history(employee_id: int):
    db = get_db()
    sessions = db.execute(
        """SELECT * FROM jourfix_sessions
           WHERE employee_id = ? AND completed_at IS NOT NULL
           ORDER BY completed_at DESC""",
        (employee_id,),
    ).fetchall()

    result = []
    for s in sessions:
        session = dict(s)
        # Get project notes for this session
        pnotes = db.execute(
            """SELECT jpn.*, p.name as project_name
               FROM jourfix_project_notes jpn
               JOIN projects p ON p.id = jpn.project_id
               WHERE jpn.jourfix_id = ?""",
            (s["id"],),
        ).fetchall()
        session["project_notes"] = [dict(pn) for pn in pnotes]
        result.append(session)

    db.close()
    return result
