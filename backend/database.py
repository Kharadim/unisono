import sqlite3
import os
from pathlib import Path

from backend.config import DATA_DIR, DB_PATH, PHOTOS_DIR

def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    ensure_dirs()
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT '',
            department TEXT NOT NULL DEFAULT '',
            responsibilities TEXT NOT NULL DEFAULT '',
            start_date TEXT,
            photo_path TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'aktiv' CHECK(status IN ('aktiv','pausiert','abgeschlossen')),
            status_text TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS project_members (
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            role_in_project TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (project_id, employee_id)
        );

        CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'offen' CHECK(status IN ('offen','in_arbeit','done')),
            due_date TEXT,
            completed_at TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS kpis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            label TEXT NOT NULL,
            value TEXT NOT NULL DEFAULT '',
            unit TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            date TEXT NOT NULL DEFAULT (date('now')),
            content TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'general' CHECK(type IN ('general','jourfix')),
            jourfix_id INTEGER REFERENCES jourfix_sessions(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            field TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS jourfix_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            general_notes TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS jourfix_project_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jourfix_id INTEGER NOT NULL REFERENCES jourfix_sessions(id) ON DELETE CASCADE,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            notes TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS jourfix_agenda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            discussed_at TEXT
        );
    """)
    conn.commit()

    # Migrations: add columns if they don't exist yet
    existing = [row[1] for row in conn.execute("PRAGMA table_info(employees)").fetchall()]
    if 'birthday' not in existing:
        conn.execute("ALTER TABLE employees ADD COLUMN birthday TEXT")
    if 'personal_notes' not in existing:
        conn.execute("ALTER TABLE employees ADD COLUMN personal_notes TEXT NOT NULL DEFAULT ''")

    # Migration: kpi_history table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS kpi_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kpi_id INTEGER NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
            old_value TEXT,
            old_unit TEXT,
            new_value TEXT,
            new_unit TEXT,
            changed_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # v2.1 Migration: agreements table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agreements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'offen' CHECK(status IN ('offen','erledigt')),
            due_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            jourfix_id INTEGER REFERENCES jourfix_sessions(id) ON DELETE SET NULL
        )
    """)

    # v2.1 Migration: goals table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'offen' CHECK(status IN ('offen','in_arbeit','erreicht','nicht_erreicht')),
            category TEXT NOT NULL DEFAULT 'fachlich' CHECK(category IN ('fachlich','persoenlich','fuehrung')),
            due_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            period TEXT NOT NULL DEFAULT '2026'
        )
    """)

    # v2.1 Migration: tag_definitions table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tag_definitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT 'blue',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # v2.1: Insert default tags if table is empty
    existing_tags = conn.execute("SELECT COUNT(*) FROM tag_definitions").fetchone()[0]
    if existing_tags == 0:
        default_tags = [
            ('Feedback', 'blue', 0),
            ('Entwicklung', 'purple', 1),
            ('Lob', 'green', 2),
            ('Konflikt', 'orange', 3),
            ('Eskalation', 'red', 4),
            ('Vereinbarung', 'cyan', 5),
            ('Idee', 'yellow', 6),
        ]
        conn.executemany(
            "INSERT INTO tag_definitions (name, color, sort_order) VALUES (?, ?, ?)",
            default_tags,
        )

    # v2.1 Migration: add tags column to notes
    notes_cols = [row[1] for row in conn.execute("PRAGMA table_info(notes)").fetchall()]
    if 'tags' not in notes_cols:
        conn.execute("ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT ''")

    # v2.1 Migration: add tags column to jourfix_project_notes
    jpn_cols = [row[1] for row in conn.execute("PRAGMA table_info(jourfix_project_notes)").fetchall()]
    if 'tags' not in jpn_cols:
        conn.execute("ALTER TABLE jourfix_project_notes ADD COLUMN tags TEXT NOT NULL DEFAULT ''")

    # v2.1 Migration: add mood column to jourfix_sessions
    jfs_cols = [row[1] for row in conn.execute("PRAGMA table_info(jourfix_sessions)").fetchall()]
    if 'mood' not in jfs_cols:
        conn.execute("ALTER TABLE jourfix_sessions ADD COLUMN mood INTEGER")

    # v2.7 Migration: development plan tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS development_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            period TEXT NOT NULL DEFAULT '2026',
            summary TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS dev_strengths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS dev_areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'mittel' CHECK(priority IN ('hoch','mittel','niedrig')),
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS dev_measures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL REFERENCES dev_areas(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'offen' CHECK(status IN ('offen','in_arbeit','erledigt')),
            due_date TEXT,
            completed_at TEXT,
            goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # v2.8 Migration: STEPs fields on development_plans
    dp_cols = [row[1] for row in conn.execute("PRAGMA table_info(development_plans)").fetchall()]
    steps_columns = {
        'reflexion_tasks': "TEXT NOT NULL DEFAULT ''",
        'reflexion_successes': "TEXT NOT NULL DEFAULT ''",
        'reflexion_challenges': "TEXT NOT NULL DEFAULT ''",
        'reflexion_focus': "TEXT NOT NULL DEFAULT ''",
        'performance_rating': "TEXT NOT NULL DEFAULT ''",
        'change_interest': "TEXT NOT NULL DEFAULT ''",
        'change_interest_details': "TEXT NOT NULL DEFAULT ''",
        'talent_pool': "TEXT NOT NULL DEFAULT ''",
        'mobility_willing': "INTEGER",
        'mobility_scope': "TEXT NOT NULL DEFAULT ''",
        'mobility_locations': "TEXT NOT NULL DEFAULT ''",
        'remarks': "TEXT NOT NULL DEFAULT ''",
    }
    for col_name, col_type in steps_columns.items():
        if col_name not in dp_cols:
            conn.execute(f"ALTER TABLE development_plans ADD COLUMN {col_name} {col_type}")

    # v2.8 Migration: dev_trainings table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dev_trainings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'vorgeschlagen'
                CHECK(status IN ('vorgeschlagen','genehmigt','abgeschlossen')),
            provider TEXT NOT NULL DEFAULT '',
            cost TEXT NOT NULL DEFAULT '',
            due_date TEXT,
            completed_at TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # v2.6 Migration: settings table (key-value store)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT ''
        )
    """)
    # Insert default KI settings if not present
    ki_defaults = [
        ('ki_provider', 'ollama'),
        ('ki_endpoint', 'http://localhost:11434'),
        ('ki_api_key', ''),
        ('ki_model', 'llama3.2'),
        ('ki_enabled', 'true'),
        ('auth_password_hash', ''),
        ('auth_session_token', ''),
    ]
    for key, value in ki_defaults:
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
            (key, value),
        )

    conn.commit()
    conn.close()
