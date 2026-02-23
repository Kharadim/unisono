from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import AgreementCreate, AgreementUpdate

router = APIRouter(tags=["agreements"])


@router.get("/api/employees/{employee_id}/agreements")
def list_agreements(employee_id: int):
    db = get_db()
    rows = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ?
           ORDER BY a.status ASC, a.due_date ASC, a.created_at DESC""",
        (employee_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("/api/employees/{employee_id}/agreements", status_code=201)
def create_agreement(employee_id: int, data: AgreementCreate):
    db = get_db()
    emp = db.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not emp:
        db.close()
        raise HTTPException(404, "Employee not found")

    cur = db.execute(
        "INSERT INTO agreements (employee_id, content, project_id, due_date, jourfix_id) VALUES (?, ?, ?, ?, ?)",
        (employee_id, data.content, data.project_id, data.due_date, data.jourfix_id),
    )
    db.commit()
    row = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.id = ?""",
        (cur.lastrowid,),
    ).fetchone()
    db.close()
    return dict(row)


@router.put("/api/agreements/{agreement_id}")
def update_agreement(agreement_id: int, data: AgreementUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM agreements WHERE id = ?", (agreement_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Agreement not found")

    updates = []
    params = []
    if data.content is not None:
        updates.append("content = ?")
        params.append(data.content)
    if data.project_id is not None:
        updates.append("project_id = ?")
        # project_id=0 means "remove project assignment"
        params.append(None if data.project_id == 0 else data.project_id)
    if data.due_date is not None:
        updates.append("due_date = ?")
        params.append(data.due_date)

    if updates:
        params.append(agreement_id)
        db.execute(f"UPDATE agreements SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    row = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.id = ?""",
        (agreement_id,),
    ).fetchone()
    db.close()
    return dict(row)


@router.patch("/api/agreements/{agreement_id}/toggle")
def toggle_agreement(agreement_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM agreements WHERE id = ?", (agreement_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Agreement not found")

    new_status = "erledigt" if row["status"] == "offen" else "offen"
    completed_at = "datetime('now')" if new_status == "erledigt" else "NULL"
    db.execute(
        f"UPDATE agreements SET status = ?, completed_at = {completed_at} WHERE id = ?",
        (new_status, agreement_id),
    )
    db.commit()
    row = db.execute(
        """SELECT a.*, p.name as project_name
           FROM agreements a LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.id = ?""",
        (agreement_id,),
    ).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/agreements/{agreement_id}", status_code=204)
def delete_agreement(agreement_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM agreements WHERE id = ?", (agreement_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Agreement not found")

    db.execute("DELETE FROM agreements WHERE id = ?", (agreement_id,))
    db.commit()
    db.close()
