import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.database import get_db, PHOTOS_DIR
from backend.schemas import EmployeeCreate, EmployeeUpdate

router = APIRouter(prefix="/api/employees", tags=["employees"])


def row_to_dict(row):
    return dict(row) if row else None


@router.get("")
def list_employees():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM employees ORDER BY name"
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def create_employee(data: EmployeeCreate):
    db = get_db()
    cur = db.execute(
        """INSERT INTO employees (name, role, department, responsibilities, start_date, birthday, personal_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (data.name, data.role, data.department, data.responsibilities, data.start_date, data.birthday, data.personal_notes),
    )
    db.commit()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.get("/{employee_id}")
def get_employee(employee_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Employee not found")

    # Also fetch assigned projects
    projects = db.execute(
        """SELECT p.*, pm.role_in_project
           FROM projects p
           JOIN project_members pm ON pm.project_id = p.id
           WHERE pm.employee_id = ?
           ORDER BY p.name""",
        (employee_id,),
    ).fetchall()

    db.close()
    emp = dict(row)
    emp["projects"] = [dict(p) for p in projects]
    return emp


@router.put("/{employee_id}")
def update_employee(employee_id: int, data: EmployeeUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Employee not found")

    current = dict(row)
    updates = data.model_dump(exclude_unset=True)
    for key, val in updates.items():
        current[key] = val

    db.execute(
        """UPDATE employees SET name=?, role=?, department=?, responsibilities=?, start_date=?, birthday=?, personal_notes=?
           WHERE id=?""",
        (current["name"], current["role"], current["department"],
         current["responsibilities"], current["start_date"], current["birthday"], current["personal_notes"], employee_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Employee not found")
    db.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
    db.commit()
    db.close()


@router.post("/{employee_id}/photo")
def upload_photo(employee_id: int, file: UploadFile = File(...)):
    db = get_db()
    row = db.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Employee not found")

    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        db.close()
        raise HTTPException(400, "Only jpg, png, webp allowed")

    filename = f"{employee_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = PHOTOS_DIR / filename

    # Remove old photo
    old_photo = row["photo_path"]
    if old_photo:
        old_path = PHOTOS_DIR / old_photo
        if old_path.exists():
            old_path.unlink()

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    db.execute("UPDATE employees SET photo_path = ? WHERE id = ?", (filename, employee_id))
    db.commit()
    db.close()
    return {"photo_path": filename}
