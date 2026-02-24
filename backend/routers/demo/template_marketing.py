from backend.routers.demo.routes import register_template
from backend.routers.demo.helpers import (
    d, past, now_iso, past_datetime, generate_demo_photos,
)


@register_template("marketing")
def insert(db):
    now = now_iso()

    # --- Generate demo photos ---
    photos = generate_demo_photos([
        (1, "Anna Mueller", "https://randomuser.me/api/portraits/women/44.jpg", "#6366f1"),
        (2, "Tobias Schmidt", "https://randomuser.me/api/portraits/men/32.jpg", "#0891b2"),
        (3, "Lisa Weber", "https://randomuser.me/api/portraits/women/68.jpg", "#d946ef"),
    ])

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
        (1, 1, "Lead"),
        (1, 2, "SEO-Support"),
        (2, 2, "Lead"),
        (2, 3, "Content"),
        (3, 1, "Strategie"),
        (3, 2, "Analytics"),
        (3, 3, "Lead"),
        (4, 1, "Lead"),
    ]
    db.executemany(
        "INSERT INTO project_members (project_id, employee_id, role_in_project) VALUES (?, ?, ?)",
        members,
    )

    # --- Milestones ---
    # Project 1: Google Ads (2 done, 1 in_arbeit, 2 offen)
    milestones = [
        (1, "Konto-Audit abgeschlossen", "done", past(25), past(25), 0),
        (1, "Neue Kampagnenstruktur aufgesetzt", "done", past(10), past(12), 1),
        (1, "PMax Kampagnen live", "in_arbeit", d(5), None, 2),
        (1, "Demand Gen Kampagne launchen", "offen", d(20), None, 3),
        (1, "Performance Review nach 4 Wochen", "offen", d(40), None, 4),
    ]
    # Project 2: SEO Hub (2 done, 1 OVERDUE, 2 offen)
    milestones += [
        (2, "Keyword-Recherche fertig", "done", past(30), past(32), 0),
        (2, "Content-Planung erstellt", "done", past(15), past(16), 1),
        (2, "10 Landingpages live", "offen", past(3), None, 2),  # OVERDUE
        (2, "Schema Markup implementiert", "offen", d(15), None, 3),
        (2, "Interne Verlinkung optimiert", "offen", d(30), None, 4),
    ]
    # Project 3: Newsletter (1 done, 1 in_arbeit, 1 offen)
    milestones += [
        (3, "Analyse bestehender Newsletter-KPIs", "done", past(14), past(15), 0),
        (3, "A/B-Test Framework aufsetzen", "in_arbeit", d(3), None, 1),
        (3, "Segmentierungs-Strategie umsetzen", "offen", d(25), None, 2),
    ]
    # Project 4: Black Friday (all done)
    milestones += [
        (4, "Kampagnen-Konzept", "done", "2025-10-15", "2025-10-14", 0),
        (4, "Creative Assets produziert", "done", "2025-11-01", "2025-10-30", 1),
        (4, "Kampagnen live", "done", "2025-11-20", "2025-11-19", 2),
        (4, "Reporting & Learnings", "done", "2025-12-15", "2025-12-10", 3),
    ]
    for proj_id, name, status, due, completed, sort in milestones:
        db.execute(
            """INSERT INTO milestones (project_id, name, status, due_date, completed_at, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (proj_id, name, status, due, completed, sort),
        )

    # --- KPIs ---
    kpis = [
        (1, "ROAS", "3.2", "x", 0),
        (1, "CPA", "28.50", "EUR", 1),
        (1, "Conversion Rate", "4.1", "%", 2),
        (2, "Organischer Traffic", "12.500", "Sessions/Mo", 0),
        (2, "Keyword Rankings Top 10", "23", "Keywords", 1),
        (2, "Seiten indexiert", "8", "von 50", 2),
        (3, "Open Rate", "24.3", "%", 0),
        (3, "Click Rate", "3.8", "%", 1),
        (4, "Umsatz", "1.2M", "EUR", 0),
        (4, "ROAS", "5.8", "x", 1),
    ]
    for proj_id, label, value, unit, sort in kpis:
        db.execute(
            "INSERT INTO kpis (project_id, label, value, unit, sort_order) VALUES (?, ?, ?, ?, ?)",
            (proj_id, label, value, unit, sort),
        )

    # --- Jour Fixe Sessions ---
    jf1_started = past_datetime(10, 1)
    jf1_completed = past_datetime(10)
    jf2_started = past_datetime(7, 1)
    jf2_completed = past_datetime(7)

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
        (past(5), past_datetime(5)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (3, ?, 'Lisa hat beim Newsletter-Redesign eigenstaendig ein neues Template entwickelt — sehr gute Initiative', 'general', 'Lob', ?)""",
        (past(3), past_datetime(3)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (2, ?, 'Tobias moechte sich im Bereich Data Analytics weiterentwickeln. Kurs-Optionen recherchieren.', 'general', 'Entwicklung,Idee', ?)""",
        (past(12), past_datetime(12)),
    )

    # --- Agreements ---
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (1, 1, 'Budget-Vorschlag fuer Q2 Demand Gen erstellen', 'offen', ?, ?, 1)""",
        (past(2), jf1_completed),  # OVERDUE
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (2, 2, 'Freelancer-Briefing fuer Content-Produktion schreiben', 'offen', ?, ?, 2)""",
        (d(5), jf2_completed),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, content, status, due_date, created_at)
           VALUES (3, 'Newsletter-Segmentierungs-Konzept vorstellen', 'offen', ?, ?)""",
        (d(10), past_datetime(4)),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, completed_at, jourfix_id)
           VALUES (1, 1, 'Konto-Audit Ergebnisse praesentieren', 'erledigt', ?, ?, ?, 1)""",
        (past(20), past_datetime(30), past(22)),
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
        (past_datetime(1),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, content, created_at)
           VALUES (2, 'Data Analytics Weiterbildung — konkrete Kurse vorstellen', ?)""",
        (past_datetime(2),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, project_id, content, created_at)
           VALUES (3, 3, 'Segmentierungs-Strategie Review vor Umsetzung', ?)""",
        (past_datetime(0, 5),),
    )
