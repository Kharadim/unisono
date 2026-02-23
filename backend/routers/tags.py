from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import TagCreate, TagUpdate, ReorderRequest

router = APIRouter(tags=["tags"])


@router.get("/api/tags")
def list_tags():
    db = get_db()
    rows = db.execute("SELECT * FROM tag_definitions ORDER BY sort_order, id").fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("/api/tags", status_code=201)
def create_tag(data: TagCreate):
    db = get_db()
    # Get next sort_order
    max_order = db.execute("SELECT COALESCE(MAX(sort_order), -1) FROM tag_definitions").fetchone()[0]
    try:
        cur = db.execute(
            "INSERT INTO tag_definitions (name, color, sort_order) VALUES (?, ?, ?)",
            (data.name, data.color, max_order + 1),
        )
        db.commit()
    except Exception:
        db.close()
        raise HTTPException(400, "Tag name already exists")

    row = db.execute("SELECT * FROM tag_definitions WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/tags/{tag_id}")
def update_tag(tag_id: int, data: TagUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM tag_definitions WHERE id = ?", (tag_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Tag not found")

    old_name = row["name"]
    updates = []
    params = []
    if data.name is not None:
        updates.append("name = ?")
        params.append(data.name)
    if data.color is not None:
        updates.append("color = ?")
        params.append(data.color)

    if updates:
        params.append(tag_id)
        db.execute(f"UPDATE tag_definitions SET {', '.join(updates)} WHERE id = ?", params)

        # If name changed, update references in notes and jourfix_project_notes
        if data.name is not None and data.name != old_name:
            _rename_tag_in_table(db, "notes", old_name, data.name)
            _rename_tag_in_table(db, "jourfix_project_notes", old_name, data.name)

        db.commit()

    row = db.execute("SELECT * FROM tag_definitions WHERE id = ?", (tag_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM tag_definitions WHERE id = ?", (tag_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Tag not found")

    tag_name = row["name"]

    # Remove tag from notes and jourfix_project_notes
    _remove_tag_from_table(db, "notes", tag_name)
    _remove_tag_from_table(db, "jourfix_project_notes", tag_name)

    db.execute("DELETE FROM tag_definitions WHERE id = ?", (tag_id,))
    db.commit()
    db.close()


@router.patch("/api/tags/reorder")
def reorder_tags(data: ReorderRequest):
    db = get_db()
    for i, tag_id in enumerate(data.ordered_ids):
        db.execute("UPDATE tag_definitions SET sort_order = ? WHERE id = ?", (i, tag_id))
    db.commit()
    rows = db.execute("SELECT * FROM tag_definitions ORDER BY sort_order, id").fetchall()
    db.close()
    return [dict(r) for r in rows]


def _rename_tag_in_table(db, table: str, old_name: str, new_name: str):
    """Rename a tag in comma-separated tags column."""
    rows = db.execute(f"SELECT id, tags FROM {table} WHERE tags LIKE ?", (f"%{old_name}%",)).fetchall()
    for r in rows:
        tag_list = [t.strip() for t in r["tags"].split(",") if t.strip()]
        tag_list = [new_name if t == old_name else t for t in tag_list]
        db.execute(f"UPDATE {table} SET tags = ? WHERE id = ?", (",".join(tag_list), r["id"]))


def _remove_tag_from_table(db, table: str, tag_name: str):
    """Remove a tag from comma-separated tags column."""
    rows = db.execute(f"SELECT id, tags FROM {table} WHERE tags LIKE ?", (f"%{tag_name}%",)).fetchall()
    for r in rows:
        tag_list = [t.strip() for t in r["tags"].split(",") if t.strip()]
        tag_list = [t for t in tag_list if t != tag_name]
        db.execute(f"UPDATE {table} SET tags = ? WHERE id = ?", (",".join(tag_list), r["id"]))
