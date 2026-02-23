from fastapi import APIRouter, HTTPException
from datetime import date, timedelta, datetime
from backend.database import get_db, PHOTOS_DIR
import requests
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

router = APIRouter(tags=["demo"])


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
    db.close()
    return {
        "isEmpty": emp_count == 0,
        "demoDataLoaded": demo_loaded["value"] == "true" if demo_loaded else False,
        "welcomeDismissed": welcome_dismissed["value"] == "true" if welcome_dismissed else False,
    }


@router.post("/api/demo-data/load")
def load_demo_data():
    db = get_db()
    emp_count = db.execute("SELECT COUNT(*) as cnt FROM employees").fetchone()["cnt"]
    if emp_count > 0:
        db.close()
        raise HTTPException(400, "Datenbank ist nicht leer. Demo-Daten koennen nur in eine leere Datenbank geladen werden.")

    _insert_demo_data(db)

    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_data_loaded', 'true')"
    )
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('welcome_dismissed', 'true')"
    )
    db.commit()
    db.close()
    return {"ok": True, "message": "Demo-Daten erfolgreich geladen"}


@router.delete("/api/demo-data")
def delete_demo_data():
    db = get_db()

    # Delete in correct FK order (children before parents)
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
    _delete_demo_photos()

    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_data_loaded', 'false')"
    )
    db.execute(
        "DELETE FROM settings WHERE key = 'welcome_dismissed'"
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


def _generate_demo_photos():
    """Download demo photos or generate Pillow avatars as fallback."""
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    sources = [
        (1, "Anna Mueller", "https://randomuser.me/api/portraits/women/44.jpg", "#6366f1"),
        (2, "Tobias Schmidt", "https://randomuser.me/api/portraits/men/32.jpg", "#0891b2"),
        (3, "Lisa Weber", "https://randomuser.me/api/portraits/women/68.jpg", "#d946ef"),
    ]
    photos = {}
    for emp_id, name, url, fallback_color in sources:
        filename = f"{emp_id}_demo.jpg"
        filepath = PHOTOS_DIR / filename
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                photos[emp_id] = filename
                continue
        except Exception:
            pass
        # Fallback: Pillow avatar
        photos[emp_id] = _generate_avatar(emp_id, name, fallback_color)
    return photos


def _generate_avatar(employee_id, name, bg_color):
    """Generate a simple avatar image with initials using Pillow."""
    size = 256
    img = Image.new("RGB", (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    initials = "".join(word[0].upper() for word in name.split()[:2])
    font_size = 96
    font = None
    for font_name in ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), initials, fill="white", font=font)
    filename = f"{employee_id}_demo.jpg"
    filepath = PHOTOS_DIR / filename
    img.save(filepath, "JPEG", quality=90)
    return filename


def _delete_demo_photos():
    """Remove demo photo files from disk."""
    for f in PHOTOS_DIR.glob("*_demo.*"):
        f.unlink(missing_ok=True)


def _insert_demo_data(db):
    today = date.today()
    now = datetime.now().isoformat(timespec="seconds")

    # --- Generate demo photos ---
    photos = _generate_demo_photos()

    # --- Employees ---
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (1, 'Anna Mueller', 'Senior Performance Marketing Manager', 'Performance Marketing',
                   'Google Ads, Meta Ads, Budget-Verantwortung, Kampagnen-Strategie',
                   '2022-03-15', '1991-06-12', '', ?, ?)""",
        (photos.get(1), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (2, 'Tobias Schmidt', 'SEO Specialist', 'Performance Marketing',
                   'Tech SEO, Content-Strategie, Search Console, Keyword-Recherche',
                   '2023-09-01', '1994-11-28', '', ?, ?)""",
        (photos.get(2), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (3, 'Lisa Weber', 'Content Marketing Manager', 'Performance Marketing',
                   'Blog, Newsletter, Social Media Content, Redaktionsplanung',
                   '2024-06-01', '1996-04-05', '', ?, ?)""",
        (photos.get(3), now),
    )

    # --- Projects ---
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (1, 'Google Ads Relaunch Q1',
                   'Komplette Neustrukturierung der Google Ads Kampagnen mit Fokus auf ROAS-Optimierung und neue Kampagnentypen (PMax, Demand Gen)',
                   'aktiv', 'Kampagnenstruktur steht, erste Tests laufen', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (2, 'SEO Content Hub Destinationen',
                   'Aufbau eines Destination-Content-Hubs mit 50+ Landingpages, interner Verlinkung und Schema Markup',
                   'aktiv', 'Content-Planung abgeschlossen, erste Seiten live', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (3, 'Newsletter Performance Optimierung',
                   'A/B-Testing Programm fuer Newsletter: Betreffzeilen, Versandzeitpunkte, Segmentierung, CTAs',
                   'aktiv', 'Erste A/B-Tests gestartet', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (4, 'Black Friday Kampagne 2025',
                   'Kanaluebergreifende Performance-Kampagne fuer Black Friday / Cyber Monday 2025',
                   'abgeschlossen', 'Erfolgreich abgeschlossen, +34% vs. Vorjahr', ?)""",
        (now,),
    )

    # --- Project Members ---
    members = [
        (1, 1, "Lead"),    # Anna → Google Ads
        (1, 2, "SEO-Support"),  # Tobias → Google Ads
        (2, 2, "Lead"),    # Tobias → SEO Hub
        (2, 3, "Content"),  # Lisa → SEO Hub
        (3, 1, "Strategie"),  # Anna → Newsletter
        (3, 2, "Analytics"),   # Tobias → Newsletter
        (3, 3, "Lead"),    # Lisa → Newsletter
        (4, 1, "Lead"),    # Anna → Black Friday
    ]
    db.executemany(
        "INSERT INTO project_members (project_id, employee_id, role_in_project) VALUES (?, ?, ?)",
        members,
    )

    # --- Milestones ---
    d = lambda offset: (today + timedelta(days=offset)).isoformat()
    past = lambda offset: (today - timedelta(days=offset)).isoformat()

    # Project 1: Google Ads (2 done, 1 in_arbeit, 2 offen)
    milestones = [
        (1, 1, "Konto-Audit abgeschlossen", "done", past(25), past(25), 0),
        (1, 1, "Neue Kampagnenstruktur aufgesetzt", "done", past(10), past(12), 1),
        (1, 1, "PMax Kampagnen live", "in_arbeit", d(5), None, 2),
        (1, 1, "Demand Gen Kampagne launchen", "offen", d(20), None, 3),
        (1, 1, "Performance Review nach 4 Wochen", "offen", d(40), None, 4),
    ]
    # Project 2: SEO Hub (2 done, 1 OVERDUE, 2 offen)
    milestones += [
        (2, 2, "Keyword-Recherche fertig", "done", past(30), past(32), 0),
        (2, 2, "Content-Planung erstellt", "done", past(15), past(16), 1),
        (2, 2, "10 Landingpages live", "offen", past(3), None, 2),  # OVERDUE
        (2, 2, "Schema Markup implementiert", "offen", d(15), None, 3),
        (2, 2, "Interne Verlinkung optimiert", "offen", d(30), None, 4),
    ]
    # Project 3: Newsletter (1 done, 1 in_arbeit, 1 offen)
    milestones += [
        (3, 3, "Analyse bestehender Newsletter-KPIs", "done", past(14), past(15), 0),
        (3, 3, "A/B-Test Framework aufsetzen", "in_arbeit", d(3), None, 1),
        (3, 3, "Segmentierungs-Strategie umsetzen", "offen", d(25), None, 2),
    ]
    # Project 4: Black Friday (all done)
    milestones += [
        (4, 4, "Kampagnen-Konzept", "done", "2025-10-15", "2025-10-14", 0),
        (4, 4, "Creative Assets produziert", "done", "2025-11-01", "2025-10-30", 1),
        (4, 4, "Kampagnen live", "done", "2025-11-20", "2025-11-19", 2),
        (4, 4, "Reporting & Learnings", "done", "2025-12-15", "2025-12-10", 3),
    ]
    for m_id, proj_id, name, status, due, completed, sort in milestones:
        db.execute(
            """INSERT INTO milestones (project_id, name, status, due_date, completed_at, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (proj_id, name, status, due, completed, sort),
        )

    # --- KPIs ---
    kpis = [
        # Project 1: Google Ads
        (1, "ROAS", "3.2", "x", 0),
        (1, "CPA", "28.50", "EUR", 1),
        (1, "Conversion Rate", "4.1", "%", 2),
        # Project 2: SEO Hub
        (2, "Organischer Traffic", "12.500", "Sessions/Mo", 0),
        (2, "Keyword Rankings Top 10", "23", "Keywords", 1),
        (2, "Seiten indexiert", "8", "von 50", 2),
        # Project 3: Newsletter
        (3, "Open Rate", "24.3", "%", 0),
        (3, "Click Rate", "3.8", "%", 1),
        # Project 4: Black Friday
        (4, "Umsatz", "1.2M", "EUR", 0),
        (4, "ROAS", "5.8", "x", 1),
    ]
    for proj_id, label, value, unit, sort in kpis:
        db.execute(
            "INSERT INTO kpis (project_id, label, value, unit, sort_order) VALUES (?, ?, ?, ?, ?)",
            (proj_id, label, value, unit, sort),
        )

    # --- Jour Fixe Sessions ---
    jf1_started = (datetime.now() - timedelta(days=10, hours=1)).isoformat(timespec="seconds")
    jf1_completed = (datetime.now() - timedelta(days=10)).isoformat(timespec="seconds")
    jf2_started = (datetime.now() - timedelta(days=7, hours=1)).isoformat(timespec="seconds")
    jf2_completed = (datetime.now() - timedelta(days=7)).isoformat(timespec="seconds")

    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (1, 1, ?, ?, 'Anna ist sehr motiviert, Kampagnen-Relaunch laeuft gut. Erwaehnt Interesse an Teamlead-Rolle.', 4)""",
        (jf1_started, jf1_completed),
    )
    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (2, 2, ?, ?, 'Content-Deadline fuer SEO Hub wird eng. Priorisierung und ggf. Freelancer-Unterstuetzung besprechen.', 3)""",
        (jf2_started, jf2_completed),
    )

    # --- JF Project Notes ---
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (1, 1, 'PMax Tests zeigen +15% Conversion Rate vs. alte Kampagnen. Budget-Shift von 20% geplant.', 'Feedback')"""
    )
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (2, 2, 'Content-Produktion hinkt hinterher, 10-Seiten-Milestone verschoben. Freelancer-Unterstuetzung besprochen.', 'Eskalation')"""
    )

    # --- Notes ---
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (1, ?, 'Anna ist sehr motiviert, Kampagnen-Relaunch laeuft gut. Erwaehnt Interesse an Teamlead-Rolle.', 'jourfix', 1, 'Feedback,Entwicklung', ?)""",
        (past(10), jf1_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (2, ?, 'Content-Deadline fuer SEO Hub wird eng. Priorisierung und ggf. Freelancer-Unterstuetzung besprechen.', 'jourfix', 2, 'Feedback', ?)""",
        (past(7), jf2_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (1, ?, 'Budget-Freigabe fuer Q2 klaeren — Vorschlag 15% Erhoehung fuer Demand Gen', 'general', 'Vereinbarung', ?)""",
        (past(5), (datetime.now() - timedelta(days=5)).isoformat(timespec="seconds")),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (3, ?, 'Lisa hat beim Newsletter-Redesign eigenstaendig ein neues Template entwickelt — sehr gute Initiative', 'general', 'Lob', ?)""",
        (past(3), (datetime.now() - timedelta(days=3)).isoformat(timespec="seconds")),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (2, ?, 'Tobias moechte sich im Bereich Data Analytics weiterentwickeln. Kurs-Optionen recherchieren.', 'general', 'Entwicklung,Idee', ?)""",
        (past(12), (datetime.now() - timedelta(days=12)).isoformat(timespec="seconds")),
    )

    # --- Agreements ---
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (1, 1, 'Budget-Vorschlag fuer Q2 Demand Gen erstellen', 'offen', ?, ?, 1)""",
        (past(2), jf1_completed),  # OVERDUE — due 2 days ago
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (2, 2, 'Freelancer-Briefing fuer Content-Produktion schreiben', 'offen', ?, ?, 2)""",
        (d(5), jf2_completed),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, content, status, due_date, created_at)
           VALUES (3, 'Newsletter-Segmentierungs-Konzept vorstellen', 'offen', ?, ?)""",
        (d(10), (datetime.now() - timedelta(days=4)).isoformat(timespec="seconds")),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, completed_at, jourfix_id)
           VALUES (1, 1, 'Konto-Audit Ergebnisse praesentieren', 'erledigt', ?, ?, ?, 1)""",
        (past(20), (datetime.now() - timedelta(days=30)).isoformat(timespec="seconds"), past(22)),
    )

    # --- Goals ---
    goals = [
        (1, "Google Ads ROAS auf 4.0 steigern", "Durch neue Kampagnenstruktur und Bid-Strategie", "in_arbeit", "fachlich", d(60), "2026"),
        (1, "Praesentation vor Geschaeftsleitung halten", "Quartals-Review selbstaendig vorbereiten und praesentieren", "offen", "persoenlich", d(45), "2026"),
        (2, "Core Web Vitals auf allen Seiten im gruenen Bereich", "LCP < 2.5s, CLS < 0.1, INP < 200ms", "in_arbeit", "fachlich", d(30), "2026"),
        (2, "GA4 Zertifizierung abschliessen", "Google Analytics Certification", "offen", "persoenlich", d(90), "2026"),
        (3, "Newsletter-Abonnenten um 25% steigern", "Durch verbesserte Sign-up Flows und Content-Qualitaet", "offen", "fachlich", d(120), "2026"),
    ]
    for emp_id, title, desc, status, cat, due, period in goals:
        db.execute(
            """INSERT INTO goals (employee_id, title, description, status, category, due_date, period)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (emp_id, title, desc, status, cat, due, period),
        )

    # --- Development Plan (Anna) ---
    db.execute(
        """INSERT INTO development_plans (id, employee_id, period, summary,
               reflexion_tasks, reflexion_successes, reflexion_challenges, reflexion_focus,
               performance_rating, change_interest, change_interest_details,
               talent_pool, mobility_willing, mobility_scope, mobility_locations, remarks,
               created_at, updated_at)
           VALUES (1, 1, '2026',
               'Anna entwickelt sich stark in Richtung Team Lead. Fokus auf Fuehrungskompetenzen und strategische Planung.',
               'Google Ads Kampagnen-Management, Budget-Planung, Team-Koordination, Reporting an Geschaeftsleitung',
               'Erfolgreicher Relaunch der Kampagnenstruktur mit +15% ROAS. Black Friday Kampagne deutlich ueber Vorjahr.',
               'Delegation faellt manchmal schwer, moechte alles selbst kontrollieren. Zeitmanagement bei parallelen Projekten.',
               'Fuehrungskompetenzen ausbauen, strategischer denken, weniger operativ',
               'B - Uebertrifft die Anforderungen', 'option_a', '',
               '', 0, '', '', 'Anna ist eine Top-Performerin mit klarem Entwicklungspfad Richtung Teamlead.',
               ?, ?)""",
        (now, now),
    )

    # Strengths
    strengths = [
        (1, "Analytisches Denken — findet datenbasiert die besten Kampagnen-Hebel", 0),
        (1, "Hohe Eigeninitiative — treibt Projekte selbstaendig voran", 1),
        (1, "Stakeholder-Kommunikation — praesentiert sicher vor der Geschaeftsleitung", 2),
    ]
    db.executemany(
        "INSERT INTO dev_strengths (plan_id, content, sort_order) VALUES (?, ?, ?)",
        strengths,
    )

    # Dev Areas
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (1, 1, 'Fuehrungskompetenz', 'Delegation lernen, Feedback-Gespraeche fuehren, Team-Entwicklung', 'hoch', 0)"""
    )
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (2, 1, 'Strategische Planung', 'Quartalsziele definieren, Budget-Forecasting, Business Cases erstellen', 'mittel', 1)"""
    )

    # Measures (1 overdue!)
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Fuehrungskraefte-Workshop besuchen', 'offen', ?)""",
        (past(5),),  # OVERDUE
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Monatliches 1:1 Feedback mit jedem Teammitglied', 'in_arbeit', ?)""",
        (d(30),),
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (2, 'Q2 Budget-Forecast eigenstaendig erstellen', 'offen', ?)""",
        (d(45),),
    )

    # Trainings
    trainings = [
        (1, "Situatives Fuehren — Haufe Akademie", "genehmigt", "Haufe Akademie", "1.490 EUR", d(30), None, 0),
        (1, "Google Ads Advanced Certification", "abgeschlossen", "Google", "kostenlos", past(20), past(18), 1),
        (1, "Data Storytelling Workshop", "vorgeschlagen", "Udemy", "89 EUR", d(60), None, 2),
    ]
    for plan_id, content, status, provider, cost, due, completed, sort in trainings:
        db.execute(
            """INSERT INTO dev_trainings (plan_id, content, status, provider, cost, due_date, completed_at, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (plan_id, content, status, provider, cost, due, completed, sort),
        )

    # --- Agenda Items ---
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, project_id, content, created_at)
           VALUES (1, 1, 'Demand Gen Kampagne: Zeitplan und Budget besprechen', ?)""",
        ((datetime.now() - timedelta(days=1)).isoformat(timespec="seconds"),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, content, created_at)
           VALUES (2, 'Data Analytics Weiterbildung — konkrete Kurse vorstellen', ?)""",
        ((datetime.now() - timedelta(days=2)).isoformat(timespec="seconds"),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, project_id, content, created_at)
           VALUES (3, 3, 'Segmentierungs-Strategie Review vor Umsetzung', ?)""",
        ((datetime.now() - timedelta(hours=5)).isoformat(timespec="seconds"),),
    )
