from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import (
    DevPlanCreate, DevPlanUpdate,
    DevStrengthCreate, DevStrengthUpdate,
    DevAreaCreate, DevAreaUpdate,
    DevMeasureCreate, DevMeasureUpdate,
    DevTrainingCreate, DevTrainingUpdate,
    ReorderRequest,
)

router = APIRouter(tags=["devplan"])


def _load_plan_nested(db, plan_row):
    """Load a plan with all nested strengths, areas, and measures."""
    plan = dict(plan_row)

    strengths = db.execute(
        "SELECT * FROM dev_strengths WHERE plan_id = ? ORDER BY sort_order, id",
        (plan["id"],),
    ).fetchall()
    plan["strengths"] = [dict(s) for s in strengths]

    areas = db.execute(
        "SELECT * FROM dev_areas WHERE plan_id = ? ORDER BY sort_order, id",
        (plan["id"],),
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
    plan["areas"] = area_list

    trainings = db.execute(
        "SELECT * FROM dev_trainings WHERE plan_id = ? ORDER BY sort_order, id",
        (plan["id"],),
    ).fetchall()
    plan["trainings"] = [dict(t) for t in trainings]

    return plan


# --- Plans ---

@router.get("/api/employees/{employee_id}/devplan")
def list_plans(employee_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM development_plans WHERE employee_id = ? ORDER BY period DESC, created_at DESC",
        (employee_id,),
    ).fetchall()
    result = [_load_plan_nested(db, r) for r in rows]
    db.close()
    return result


@router.post("/api/employees/{employee_id}/devplan", status_code=201)
def create_plan(employee_id: int, data: DevPlanCreate):
    db = get_db()
    emp = db.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not emp:
        db.close()
        raise HTTPException(404, "Employee not found")

    cur = db.execute(
        "INSERT INTO development_plans (employee_id, period, summary) VALUES (?, ?, ?)",
        (employee_id, data.period, data.summary),
    )
    db.commit()
    row = db.execute("SELECT * FROM development_plans WHERE id = ?", (cur.lastrowid,)).fetchone()
    result = _load_plan_nested(db, row)
    db.close()
    return result


@router.put("/api/devplan/{plan_id}")
def update_plan(plan_id: int, data: DevPlanUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Plan not found")

    updates = []
    params = []
    plan_fields = [
        'period', 'summary',
        'reflexion_tasks', 'reflexion_successes', 'reflexion_challenges', 'reflexion_focus',
        'performance_rating', 'change_interest', 'change_interest_details',
        'talent_pool', 'mobility_willing', 'mobility_scope', 'mobility_locations',
        'remarks',
    ]
    for field in plan_fields:
        val = getattr(data, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if updates:
        updates.append("updated_at = datetime('now')")
        params.append(plan_id)
        db.execute(f"UPDATE development_plans SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute("SELECT * FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    result = _load_plan_nested(db, row)
    db.close()
    return result


@router.delete("/api/devplan/{plan_id}", status_code=204)
def delete_plan(plan_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Plan not found")

    db.execute("DELETE FROM development_plans WHERE id = ?", (plan_id,))
    db.commit()
    db.close()


# --- Strengths ---

@router.post("/api/devplan/{plan_id}/strengths", status_code=201)
def create_strength(plan_id: int, data: DevStrengthCreate):
    db = get_db()
    plan = db.execute("SELECT id FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    if not plan:
        db.close()
        raise HTTPException(404, "Plan not found")

    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), -1) FROM dev_strengths WHERE plan_id = ?", (plan_id,)
    ).fetchone()[0]

    cur = db.execute(
        "INSERT INTO dev_strengths (plan_id, content, sort_order) VALUES (?, ?, ?)",
        (plan_id, data.content, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_strengths WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/devplan/strengths/{strength_id}")
def update_strength(strength_id: int, data: DevStrengthUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM dev_strengths WHERE id = ?", (strength_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Strength not found")

    if data.content is not None:
        db.execute("UPDATE dev_strengths SET content = ? WHERE id = ?", (data.content, strength_id))
        db.commit()

    row = db.execute("SELECT * FROM dev_strengths WHERE id = ?", (strength_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/devplan/strengths/{strength_id}", status_code=204)
def delete_strength(strength_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_strengths WHERE id = ?", (strength_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Strength not found")

    db.execute("DELETE FROM dev_strengths WHERE id = ?", (strength_id,))
    db.commit()
    db.close()


@router.patch("/api/devplan/{plan_id}/strengths/reorder")
def reorder_strengths(plan_id: int, data: ReorderRequest):
    db = get_db()
    for i, sid in enumerate(data.ordered_ids):
        db.execute(
            "UPDATE dev_strengths SET sort_order = ? WHERE id = ? AND plan_id = ?",
            (i, sid, plan_id),
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM dev_strengths WHERE plan_id = ? ORDER BY sort_order, id", (plan_id,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


# --- Areas ---

@router.post("/api/devplan/{plan_id}/areas", status_code=201)
def create_area(plan_id: int, data: DevAreaCreate):
    db = get_db()
    plan = db.execute("SELECT id FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    if not plan:
        db.close()
        raise HTTPException(404, "Plan not found")

    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), -1) FROM dev_areas WHERE plan_id = ?", (plan_id,)
    ).fetchone()[0]

    cur = db.execute(
        "INSERT INTO dev_areas (plan_id, title, description, priority, sort_order) VALUES (?, ?, ?, ?, ?)",
        (plan_id, data.title, data.description, data.priority, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_areas WHERE id = ?", (cur.lastrowid,)).fetchone()
    area = dict(row)
    area["measures"] = []
    db.close()
    return area


@router.put("/api/devplan/areas/{area_id}")
def update_area(area_id: int, data: DevAreaUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM dev_areas WHERE id = ?", (area_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Area not found")

    updates = []
    params = []
    for field in ['title', 'description', 'priority']:
        val = getattr(data, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if updates:
        params.append(area_id)
        db.execute(f"UPDATE dev_areas SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute("SELECT * FROM dev_areas WHERE id = ?", (area_id,)).fetchone()
    area = dict(row)
    measures = db.execute(
        "SELECT * FROM dev_measures WHERE area_id = ? ORDER BY created_at, id", (area_id,)
    ).fetchall()
    area["measures"] = [dict(m) for m in measures]
    db.close()
    return area


@router.delete("/api/devplan/areas/{area_id}", status_code=204)
def delete_area(area_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_areas WHERE id = ?", (area_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Area not found")

    db.execute("DELETE FROM dev_areas WHERE id = ?", (area_id,))
    db.commit()
    db.close()


@router.patch("/api/devplan/{plan_id}/areas/reorder")
def reorder_areas(plan_id: int, data: ReorderRequest):
    db = get_db()
    for i, aid in enumerate(data.ordered_ids):
        db.execute(
            "UPDATE dev_areas SET sort_order = ? WHERE id = ? AND plan_id = ?",
            (i, aid, plan_id),
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM dev_areas WHERE plan_id = ? ORDER BY sort_order, id", (plan_id,)
    ).fetchall()
    result = []
    for r in rows:
        area = dict(r)
        measures = db.execute(
            "SELECT * FROM dev_measures WHERE area_id = ? ORDER BY created_at, id", (r["id"],)
        ).fetchall()
        area["measures"] = [dict(m) for m in measures]
        result.append(area)
    db.close()
    return result


# --- Measures ---

@router.post("/api/devplan/areas/{area_id}/measures", status_code=201)
def create_measure(area_id: int, data: DevMeasureCreate):
    db = get_db()
    area = db.execute("SELECT id FROM dev_areas WHERE id = ?", (area_id,)).fetchone()
    if not area:
        db.close()
        raise HTTPException(404, "Area not found")

    cur = db.execute(
        "INSERT INTO dev_measures (area_id, content, due_date, goal_id) VALUES (?, ?, ?, ?)",
        (area_id, data.content, data.due_date, data.goal_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/devplan/measures/{measure_id}")
def update_measure(measure_id: int, data: DevMeasureUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (measure_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Measure not found")

    updates = []
    params = []
    for field in ['content', 'due_date', 'goal_id']:
        val = getattr(data, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if updates:
        params.append(measure_id)
        db.execute(f"UPDATE dev_measures SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (measure_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/devplan/measures/{measure_id}", status_code=204)
def delete_measure(measure_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (measure_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Measure not found")

    db.execute("DELETE FROM dev_measures WHERE id = ?", (measure_id,))
    db.commit()
    db.close()


@router.patch("/api/devplan/measures/{measure_id}/toggle")
def toggle_measure(measure_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (measure_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Measure not found")

    cycle = {'offen': 'in_arbeit', 'in_arbeit': 'erledigt', 'erledigt': 'offen'}
    new_status = cycle.get(row["status"], "offen")
    completed_at_sql = "datetime('now')" if new_status == "erledigt" else "NULL"
    db.execute(
        f"UPDATE dev_measures SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
        (new_status, measure_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_measures WHERE id = ?", (measure_id,)).fetchone()
    db.close()
    return dict(row)


# --- Trainings ---

@router.post("/api/devplan/{plan_id}/trainings", status_code=201)
def create_training(plan_id: int, data: DevTrainingCreate):
    db = get_db()
    plan = db.execute("SELECT id FROM development_plans WHERE id = ?", (plan_id,)).fetchone()
    if not plan:
        db.close()
        raise HTTPException(404, "Plan not found")

    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), -1) FROM dev_trainings WHERE plan_id = ?", (plan_id,)
    ).fetchone()[0]

    cur = db.execute(
        "INSERT INTO dev_trainings (plan_id, content, provider, cost, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        (plan_id, data.content, data.provider, data.cost, data.due_date, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/devplan/trainings/{training_id}")
def update_training(training_id: int, data: DevTrainingUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (training_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Training not found")

    updates = []
    params = []
    for field in ['content', 'provider', 'cost', 'due_date']:
        val = getattr(data, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if updates:
        params.append(training_id)
        db.execute(f"UPDATE dev_trainings SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (training_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/devplan/trainings/{training_id}", status_code=204)
def delete_training(training_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (training_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Training not found")

    db.execute("DELETE FROM dev_trainings WHERE id = ?", (training_id,))
    db.commit()
    db.close()


@router.patch("/api/devplan/trainings/{training_id}/toggle")
def toggle_training(training_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (training_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Training not found")

    cycle = {'vorgeschlagen': 'genehmigt', 'genehmigt': 'abgeschlossen', 'abgeschlossen': 'vorgeschlagen'}
    new_status = cycle.get(row["status"], "vorgeschlagen")
    completed_at_sql = "datetime('now')" if new_status == "abgeschlossen" else "NULL"
    db.execute(
        f"UPDATE dev_trainings SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
        (new_status, training_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM dev_trainings WHERE id = ?", (training_id,)).fetchone()
    db.close()
    return dict(row)


@router.patch("/api/devplan/{plan_id}/trainings/reorder")
def reorder_trainings(plan_id: int, data: ReorderRequest):
    db = get_db()
    for i, tid in enumerate(data.ordered_ids):
        db.execute(
            "UPDATE dev_trainings SET sort_order = ? WHERE id = ? AND plan_id = ?",
            (i, tid, plan_id),
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM dev_trainings WHERE plan_id = ? ORDER BY sort_order, id", (plan_id,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]
