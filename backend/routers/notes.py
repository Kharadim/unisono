from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import NoteCreate, NoteUpdate

router = APIRouter(tags=["notes"])


@router.get("/api/employees/{employee_id}/notes")
def list_notes(employee_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM notes WHERE employee_id = ? ORDER BY created_at DESC",
        (employee_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("/api/employees/{employee_id}/notes", status_code=201)
def create_note(employee_id: int, data: NoteCreate):
    db = get_db()
    # Verify employee exists
    emp = db.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not emp:
        db.close()
        raise HTTPException(404, "Employee not found")

    cur = db.execute(
        "INSERT INTO notes (employee_id, content, type, date, tags) VALUES (?, ?, ?, COALESCE(?, date('now')), ?)",
        (employee_id, data.content, data.type, data.date, data.tags),
    )
    db.commit()
    row = db.execute("SELECT * FROM notes WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/notes/{note_id}")
def update_note(note_id: int, data: NoteUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Note not found")

    updates = ["content = ?"]
    params = [data.content]
    if data.tags is not None:
        updates.append("tags = ?")
        params.append(data.tags)
    params.append(note_id)
    db.execute(f"UPDATE notes SET {', '.join(updates)} WHERE id = ?", params)
    db.commit()
    row = db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Note not found")

    db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    db.commit()
    db.close()
