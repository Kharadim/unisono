from fastapi import APIRouter, HTTPException, Query
from backend.database import get_db
from backend.schemas import GoalCreate, GoalUpdate

router = APIRouter(tags=["goals"])


@router.get("/api/employees/{employee_id}/goals")
def list_goals(employee_id: int):
    db = get_db()
    rows = db.execute(
        """SELECT * FROM goals
           WHERE employee_id = ?
           ORDER BY period DESC,
             CASE status WHEN 'in_arbeit' THEN 0 WHEN 'offen' THEN 1 WHEN 'erreicht' THEN 2 ELSE 3 END,
             created_at DESC""",
        (employee_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("/api/employees/{employee_id}/goals", status_code=201)
def create_goal(employee_id: int, data: GoalCreate):
    db = get_db()
    emp = db.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not emp:
        db.close()
        raise HTTPException(404, "Employee not found")

    cur = db.execute(
        "INSERT INTO goals (employee_id, title, description, category, due_date, period) VALUES (?, ?, ?, ?, ?, ?)",
        (employee_id, data.title, data.description, data.category, data.due_date, data.period),
    )
    db.commit()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/goals/{goal_id}")
def update_goal(goal_id: int, data: GoalUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Goal not found")

    updates = []
    params = []
    for field in ['title', 'description', 'category', 'due_date', 'period']:
        val = getattr(data, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if updates:
        params.append(goal_id)
        db.execute(f"UPDATE goals SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    db.close()
    return dict(row)


@router.patch("/api/goals/{goal_id}/toggle")
def toggle_goal(goal_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Goal not found")

    cycle = {'offen': 'in_arbeit', 'in_arbeit': 'erreicht', 'erreicht': 'offen', 'nicht_erreicht': 'offen'}
    new_status = cycle.get(row["status"], "offen")
    completed_at_sql = "datetime('now')" if new_status == "erreicht" else "NULL"
    db.execute(
        f"UPDATE goals SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
        (new_status, goal_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    db.close()
    return dict(row)


@router.patch("/api/goals/{goal_id}/set-status")
def set_goal_status(goal_id: int, status: str = Query(...)):
    db = get_db()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Goal not found")

    if status not in ('offen', 'in_arbeit', 'erreicht', 'nicht_erreicht'):
        db.close()
        raise HTTPException(400, "Invalid status")

    completed_at_sql = "datetime('now')" if status in ('erreicht', 'nicht_erreicht') else "NULL"
    db.execute(
        f"UPDATE goals SET status = ?, completed_at = {completed_at_sql} WHERE id = ?",
        (status, goal_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Goal not found")

    db.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    db.commit()
    db.close()
