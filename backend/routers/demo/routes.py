from fastapi import APIRouter, HTTPException, Query
from backend.database import get_db
from backend.routers.demo.helpers import delete_demo_photos

router = APIRouter(tags=["demo"])

# Template registry — populated by @register_template decorator
TEMPLATE_REGISTRY: dict[str, callable] = {}


def register_template(key: str):
    """Decorator to register a demo data template function."""
    def decorator(fn):
        TEMPLATE_REGISTRY[key] = fn
        return fn
    return decorator


@router.get("/api/demo-data/status")
def demo_data_status():
    db = get_db()
    emp_count = db.execute("SELECT COUNT(*) as cnt FROM employees").fetchone()["cnt"]
    demo_loaded = db.execute(
        "SELECT value FROM settings WHERE key = 'demo_data_loaded'"
    ).fetchone()
    welcome_dismissed = db.execute(
        "SELECT value FROM settings WHERE key = 'welcome_dismissed'"
    ).fetchone()
    template_row = db.execute(
        "SELECT value FROM settings WHERE key = 'demo_data_template'"
    ).fetchone()
    db.close()
    return {
        "isEmpty": emp_count == 0,
        "demoDataLoaded": demo_loaded["value"] == "true" if demo_loaded else False,
        "welcomeDismissed": welcome_dismissed["value"] == "true" if welcome_dismissed else False,
        "template": template_row["value"] if template_row else None,
    }


@router.post("/api/demo-data/load")
def load_demo_data(template: str = Query(default="marketing")):
    if template not in TEMPLATE_REGISTRY:
        raise HTTPException(400, f"Unbekanntes Template: '{template}'. Verfuegbar: {', '.join(TEMPLATE_REGISTRY.keys())}")

    db = get_db()
    emp_count = db.execute("SELECT COUNT(*) as cnt FROM employees").fetchone()["cnt"]
    if emp_count > 0:
        db.close()
        raise HTTPException(400, "Datenbank ist nicht leer. Demo-Daten koennen nur in eine leere Datenbank geladen werden.")

    # Run template insert function
    TEMPLATE_REGISTRY[template](db)

    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_data_loaded', 'true')"
    )
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_data_template', ?)",
        (template,),
    )
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('welcome_dismissed', 'true')"
    )
    db.commit()
    db.close()
    return {"ok": True, "message": "Demo-Daten erfolgreich geladen"}


def _clear_all_data(db):
    """Delete all user data (employees, projects, etc.) from the database."""
    tables = [
        "dev_trainings",
        "dev_measures",
        "dev_areas",
        "dev_strengths",
        "development_plans",
        "jourfix_project_notes",
        "jourfix_agenda",
        "kpi_history",
        "notes",
        "agreements",
        "goals",
        "status_history",
        "kpis",
        "milestones",
        "project_members",
        "jourfix_sessions",
        "projects",
        "employees",
    ]
    for table in tables:
        db.execute(f"DELETE FROM {table}")

    # Reset autoincrement counters
    db.execute("DELETE FROM sqlite_sequence WHERE name IN ({})".format(
        ",".join(f"'{t}'" for t in tables)
    ))

    # Delete demo photo files from disk
    delete_demo_photos()


@router.delete("/api/demo-data")
def delete_demo_data():
    db = get_db()
    _clear_all_data(db)
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_data_loaded', 'false')"
    )
    db.execute(
        "DELETE FROM settings WHERE key = 'welcome_dismissed'"
    )
    db.execute(
        "DELETE FROM settings WHERE key = 'demo_data_template'"
    )
    db.commit()
    db.close()
    return {"ok": True, "message": "Alle Daten geloescht"}


@router.post("/api/demo-data/dismiss-welcome")
def dismiss_welcome():
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('welcome_dismissed', 'true')"
    )
    db.commit()
    db.close()
    return {"ok": True}


# Import template modules to trigger registration
import backend.routers.demo.template_marketing  # noqa: E402, F401
import backend.routers.demo.template_handwerk   # noqa: E402, F401
import backend.routers.demo.template_kanzlei    # noqa: E402, F401
