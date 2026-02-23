from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import KPICreate, KPIUpdate, ReorderRequest

router = APIRouter(tags=["kpis"])


@router.post("/api/projects/{project_id}/kpis", status_code=201)
def create_kpi(project_id: int, data: KPICreate):
    db = get_db()
    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), -1) as m FROM kpis WHERE project_id = ?",
        (project_id,),
    ).fetchone()["m"]

    cur = db.execute(
        "INSERT INTO kpis (project_id, label, value, unit, sort_order) VALUES (?, ?, ?, ?, ?)",
        (project_id, data.label, data.value, data.unit, data.sort_order or max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM kpis WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)


@router.put("/api/kpis/{kpi_id}")
def update_kpi(kpi_id: int, data: KPIUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM kpis WHERE id = ?", (kpi_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "KPI not found")

    old_value = row["value"]
    old_unit = row["unit"]

    current = dict(row)
    updates = data.model_dump(exclude_unset=True)
    for key, val in updates.items():
        current[key] = val

    # Track history if value or unit changed
    if current["value"] != old_value or current["unit"] != old_unit:
        db.execute(
            "INSERT INTO kpi_history (kpi_id, old_value, old_unit, new_value, new_unit) VALUES (?, ?, ?, ?, ?)",
            (kpi_id, old_value, old_unit, current["value"], current["unit"]),
        )

    db.execute(
        "UPDATE kpis SET label=?, value=?, unit=?, sort_order=? WHERE id=?",
        (current["label"], current["value"], current["unit"], current["sort_order"], kpi_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM kpis WHERE id = ?", (kpi_id,)).fetchone()
    db.close()
    return dict(row)


@router.delete("/api/kpis/{kpi_id}", status_code=204)
def delete_kpi(kpi_id: int):
    db = get_db()
    db.execute("DELETE FROM kpis WHERE id = ?", (kpi_id,))
    db.commit()
    db.close()


@router.get("/api/kpis/{kpi_id}/history")
def get_kpi_history(kpi_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM kpi_history WHERE kpi_id = ? ORDER BY changed_at DESC LIMIT 10",
        (kpi_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.patch("/api/projects/{project_id}/kpis/reorder")
def reorder_kpis(project_id: int, data: ReorderRequest):
    db = get_db()
    for i, kid in enumerate(data.ordered_ids):
        db.execute(
            "UPDATE kpis SET sort_order = ? WHERE id = ? AND project_id = ?",
            (i, kid, project_id),
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM kpis WHERE project_id = ? ORDER BY sort_order, id",
        (project_id,),
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]
