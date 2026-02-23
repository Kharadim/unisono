from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import ProjectCreate, ProjectUpdate, ProjectMember

router = APIRouter(prefix="/api/projects", tags=["projects"])


def get_project_with_details(db, project_id):
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return None

    project = dict(row)

    members = db.execute(
        """SELECT e.id, e.name, e.role, e.photo_path, pm.role_in_project
           FROM employees e
           JOIN project_members pm ON pm.employee_id = e.id
           WHERE pm.project_id = ?
           ORDER BY e.name""",
        (project_id,),
    ).fetchall()
    project["members"] = [dict(m) for m in members]

    milestones = db.execute(
        "SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order, id",
        (project_id,),
    ).fetchall()
    project["milestones"] = [dict(m) for m in milestones]

    kpis = db.execute(
        "SELECT * FROM kpis WHERE project_id = ? ORDER BY sort_order, id",
        (project_id,),
    ).fetchall()
    project["kpis"] = [dict(k) for k in kpis]

    # Jour Fixe project notes
    jf_notes = db.execute(
        """SELECT jpn.notes, jpn.tags, jpn.jourfix_id, js.completed_at, e.name as employee_name
           FROM jourfix_project_notes jpn
           JOIN jourfix_sessions js ON js.id = jpn.jourfix_id
           JOIN employees e ON e.id = js.employee_id
           WHERE jpn.project_id = ? AND js.completed_at IS NOT NULL
           ORDER BY js.completed_at DESC""",
        (project_id,),
    ).fetchall()
    project["jourfix_notes"] = [dict(n) for n in jf_notes]

    # Agreements for this project
    agreements = db.execute(
        """SELECT a.id, a.content, a.status, a.due_date, a.created_at, a.completed_at,
                  e.name as employee_name
           FROM agreements a
           JOIN employees e ON e.id = a.employee_id
           WHERE a.project_id = ?
           ORDER BY a.status = 'erledigt', a.due_date IS NULL, a.due_date, a.created_at""",
        (project_id,),
    ).fetchall()
    project["agreements"] = [dict(a) for a in agreements]

    return project


@router.get("")
def list_projects():
    db = get_db()
    rows = db.execute("SELECT * FROM projects ORDER BY name").fetchall()
    projects = []
    for row in rows:
        p = dict(row)
        # Count milestones
        counts = db.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
                SUM(CASE WHEN status != 'done' AND due_date < date('now') AND due_date IS NOT NULL AND due_date != '' THEN 1 ELSE 0 END) as overdue
               FROM milestones WHERE project_id = ?""",
            (row["id"],),
        ).fetchone()
        p["milestone_total"] = counts["total"]
        p["milestone_done"] = counts["done"]
        p["milestone_overdue"] = counts["overdue"]

        # Members
        members = db.execute(
            """SELECT e.id, e.name, e.photo_path
               FROM employees e JOIN project_members pm ON pm.employee_id = e.id
               WHERE pm.project_id = ?""",
            (row["id"],),
        ).fetchall()
        p["members"] = [dict(m) for m in members]
        projects.append(p)
    db.close()
    return projects


@router.post("", status_code=201)
def create_project(data: ProjectCreate):
    db = get_db()
    cur = db.execute(
        "INSERT INTO projects (name, scope, status, status_text) VALUES (?, ?, ?, ?)",
        (data.name, data.scope, data.status, data.status_text),
    )
    db.commit()
    project = get_project_with_details(db, cur.lastrowid)
    db.close()
    return project


@router.get("/{project_id}")
def get_project(project_id: int):
    db = get_db()
    project = get_project_with_details(db, project_id)
    db.close()
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.put("/{project_id}")
def update_project(project_id: int, data: ProjectUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Project not found")

    current = dict(row)
    updates = data.model_dump(exclude_unset=True)

    # Track status changes
    for key, val in updates.items():
        if val != current[key]:
            db.execute(
                "INSERT INTO status_history (project_id, field, old_value, new_value) VALUES (?, ?, ?, ?)",
                (project_id, key, str(current[key]), str(val)),
            )
        current[key] = val

    db.execute(
        "UPDATE projects SET name=?, scope=?, status=?, status_text=? WHERE id=?",
        (current["name"], current["scope"], current["status"], current["status_text"], project_id),
    )
    db.commit()
    project = get_project_with_details(db, project_id)
    db.close()
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "Project not found")
    db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    db.commit()
    db.close()


@router.post("/{project_id}/members", status_code=201)
def add_member(project_id: int, data: ProjectMember):
    db = get_db()
    try:
        db.execute(
            "INSERT INTO project_members (project_id, employee_id, role_in_project) VALUES (?, ?, ?)",
            (project_id, data.employee_id, data.role_in_project),
        )
        db.commit()
    except Exception:
        db.close()
        raise HTTPException(400, "Member already assigned or invalid IDs")
    project = get_project_with_details(db, project_id)
    db.close()
    return project


@router.put("/{project_id}/members/{employee_id}")
def update_member_role(project_id: int, employee_id: int, data: ProjectMember):
    db = get_db()
    db.execute(
        "UPDATE project_members SET role_in_project = ? WHERE project_id = ? AND employee_id = ?",
        (data.role_in_project, project_id, employee_id),
    )
    db.commit()
    project = get_project_with_details(db, project_id)
    db.close()
    return project


@router.delete("/{project_id}/members/{employee_id}", status_code=204)
def remove_member(project_id: int, employee_id: int):
    db = get_db()
    db.execute(
        "DELETE FROM project_members WHERE project_id = ? AND employee_id = ?",
        (project_id, employee_id),
    )
    db.commit()
    db.close()


@router.get("/{project_id}/history")
def get_history(project_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM status_history WHERE project_id = ? ORDER BY changed_at DESC",
        (project_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]
