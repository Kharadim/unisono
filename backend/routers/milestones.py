from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import MilestoneCreate, MilestoneUpdate, ReorderRequest

router = APIRouter(tags=["milestones"])

TOGGLE_MAP = {"offen": "in_arbeit", "in_arbeit": "done", "done": "offen"}


@router.post("/api/projects/{project_id}/milestones", status_code=201)
def create_milestone(project_id: int, data: MilestoneCreate):
    db = get_db()
    # Get max sort_order
    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), -1) as m FROM milestones WHERE project_id = ?",
        (project_id,),
    ).fetchone()["m"]

    cur = db.execute(
        "INSERT INTO milestones (project_id, name, status, due_date, sort_order) VALUES (?, ?, ?, ?, ?)",
        (project_id, data.name, data.status, data.due_date, data.sort_order or max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM milestones WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/milestones/{milestone_id}")
def update_milestone(milestone_id: int, data: MilestoneUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Milestone not found")

    current = dict(row)
    updates = data.model_dump(exclude_unset=True)
    for key, val in updates.items():
        current[key] = val

    # Set completed_at when done
    completed_at = current.get("completed_at")
    if current["status"] == "done" and not completed_at:
        completed_at = "datetime('now')"
        db.execute(
            """UPDATE milestones SET name=?, status=?, due_date=?, sort_order=?,
               completed_at=datetime('now') WHERE id=?""",
            (current["name"], current["status"], current["due_date"], current["sort_order"], milestone_id),
        )
    else:
        if current["status"] != "done":
            completed_at = None
        db.execute(
            "UPDATE milestones SET name=?, status=?, due_date=?, sort_order=?, completed_at=? WHERE id=?",
            (current["name"], current["status"], current["due_date"], current["sort_order"], completed_at, milestone_id),
        )

    db.commit()
    row = db.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/milestones/{milestone_id}", status_code=204)
def delete_milestone(milestone_id: int):
    db = get_db()
    db.execute("DELETE FROM milestones WHERE id = ?", (milestone_id,))
    db.commit()
    db.close()


@router.patch("/api/milestones/{milestone_id}/toggle")
def toggle_milestone(milestone_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Milestone not found")

    new_status = TOGGLE_MAP[row["status"]]
    completed_at = None
    if new_status == "done":
        db.execute(
            "UPDATE milestones SET status = ?, completed_at = datetime('now') WHERE id = ?",
            (new_status, milestone_id),
        )
    else:
        db.execute(
            "UPDATE milestones SET status = ?, completed_at = NULL WHERE id = ?",
            (new_status, milestone_id),
        )
    db.commit()
    row = db.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    db.close()
    return dict(row)


@router.patch("/api/projects/{project_id}/milestones/reorder")
def reorder_milestones(project_id: int, data: ReorderRequest):
    db = get_db()
    for i, mid in enumerate(data.ordered_ids):
        db.execute(
            "UPDATE milestones SET sort_order = ? WHERE id = ? AND project_id = ?",
            (i, mid, project_id),
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order, id",
        (project_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]
