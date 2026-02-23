from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import AgendaItemCreate

router = APIRouter(prefix="/api/employees", tags=["agenda"])


@router.get("/{employee_id}/agenda")
def get_agenda(employee_id: int):
    db = get_db()
    rows = db.execute(
        """SELECT a.*, p.name as project_name
           FROM jourfix_agenda a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.discussed_at IS NULL
           ORDER BY a.created_at""",
        (employee_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("/{employee_id}/agenda", status_code=201)
def create_agenda_item(employee_id: int, data: AgendaItemCreate):
    db = get_db()
    cur = db.execute(
        "INSERT INTO jourfix_agenda (employee_id, project_id, content) VALUES (?, ?, ?)",
        (employee_id, data.project_id, data.content),
    )
    db.commit()
    row = db.execute(
        """SELECT a.*, p.name as project_name
           FROM jourfix_agenda a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.id = ?""",
        (cur.lastrowid,),
    ).fetchone()
    db.close()
    return dict(row)


@router.delete("/agenda/{item_id}", status_code=204)
def delete_agenda_item(item_id: int):
    db = get_db()
    db.execute("DELETE FROM jourfix_agenda WHERE id = ?", (item_id,))
    db.commit()
    db.close()


@router.patch("/agenda/{item_id}/discuss")
def mark_discussed(item_id: int):
    db = get_db()
    db.execute(
        "UPDATE jourfix_agenda SET discussed_at = datetime('now') WHERE id = ?",
        (item_id,),
    )
    db.commit()
    db.close()
    return {"ok": True}
