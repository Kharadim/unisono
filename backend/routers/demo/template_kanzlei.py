from backend.routers.demo.routes import register_template
from backend.routers.demo.helpers import (
    d, past, now_iso, past_datetime, generate_demo_photos,
)


@register_template("kanzlei")
def insert(db):
    now = now_iso()

    # --- Generate demo photos ---
    photos = generate_demo_photos([
        (1, "Sabine Keller", "https://randomuser.me/api/portraits/women/50.jpg", "#0ea5e9"),
        (2, "Nina Hoffmann", "https://randomuser.me/api/portraits/women/35.jpg", "#ec4899"),
        (3, "Janina Becker", "https://randomuser.me/api/portraits/women/22.jpg", "#6366f1"),
    ])

    # --- Employees ---
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (1, 'Dr. Sabine Keller', 'Steuerberaterin / Partnerin', 'Steuerberatung',
                   'Mandantenbetreuung, Jahresabschluesse, Steuererklaerungen, Kanzleifuehrung',
                   '2015-01-15', '1978-09-08', '', ?, ?)""",
        (photos.get(1), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (2, 'Nina Hoffmann', 'Steuerfachangestellte', 'Steuerberatung',
                   'Finanzbuchhaltung, Lohnabrechnung, Steuererlaerungen, Mandantenkontakt',
                   '2020-03-01', '1994-04-19', '', ?, ?)""",
        (photos.get(2), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (3, 'Janina Becker', 'Auszubildende Steuerfach', 'Steuerberatung',
                   'Belegerfassung, Kontierung, Berufsschule, Assistenz Jahresabschluesse',
                   '2024-08-01', '2005-06-25', '', ?, ?)""",
        (photos.get(3), now),
    )

    # --- Projects ---
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (1, 'Jahresabschluesse Q1',
                   'Erstellung der Jahresabschluesse und Steuererklaerungen fuer 28 Mandanten (Abgabefrist 31.05.). Inkl. E-Bilanz und Offenlegung.',
                   'aktiv', '12 von 28 Mandanten abgeschlossen', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (2, 'DATEV-Migration',
                   'Umstellung von DATEV classic auf DATEV Cloud (DUO). Migration aller Mandanten-Stammdaten, Schulung Team, neue Workflows.',
                   'aktiv', 'Testphase mit 5 Pilotmandanten', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (3, 'Mandantenportal einfuehren',
                   'Einfuehrung eines digitalen Mandantenportals fuer Belegaustausch, Dokumentenfreigabe und Kommunikation. Ziel: 60% der Mandanten aktiv.',
                   'aktiv', 'Portal eingerichtet, erste Mandanten eingeladen', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (4, 'Digitale Belegerfassung',
                   'Einfuehrung automatischer Belegerfassung per OCR (DATEV Unternehmen online) fuer alle Buchhaltungsmandanten.',
                   'abgeschlossen', 'Erfolgreich ausgerollt, 85% Erkennungsrate', ?)""",
        (now,),
    )

    # --- Project Members ---
    members = [
        (1, 1, "Verantwortlich"),
        (1, 2, "Sachbearbeitung"),
        (1, 3, "Zuarbeit"),
        (2, 1, "Projektleitung"),
        (2, 2, "Key User"),
        (3, 1, "Verantwortlich"),
        (3, 2, "Mandantenkontakt"),
        (4, 2, "Umsetzung"),
    ]
    db.executemany(
        "INSERT INTO project_members (project_id, employee_id, role_in_project) VALUES (?, ?, ?)",
        members,
    )

    # --- Milestones ---
    # Project 1: Jahresabschluesse (2 done, 1 in_arbeit, 2 offen)
    milestones = [
        (1, "Belegpruefung alle Mandanten", "done", past(30), past(32), 0),
        (1, "12 Abschluesse erstellt und versendet", "done", past(8), past(9), 1),
        (1, "Weitere 10 Abschluesse (bis KW 14)", "in_arbeit", d(10), None, 2),
        (1, "Restliche 6 Abschluesse", "offen", d(30), None, 3),
        (1, "E-Bilanz und Offenlegung komplett", "offen", d(45), None, 4),
    ]
    # Project 2: DATEV-Migration (1 done, 1 OVERDUE, 2 offen)
    milestones += [
        (2, "Migrationsleitfaden erstellt", "done", past(25), past(26), 0),
        (2, "Team-Schulung DATEV DUO", "offen", past(4), None, 1),  # OVERDUE
        (2, "5 Pilotmandanten migriert", "offen", d(15), None, 2),
        (2, "Alle Mandanten migriert + Go-Live", "offen", d(40), None, 3),
    ]
    # Project 3: Mandantenportal (1 done, 1 in_arbeit, 1 offen)
    milestones += [
        (3, "Portal eingerichtet und konfiguriert", "done", past(14), past(15), 0),
        (3, "Erste 20 Mandanten onboarden", "in_arbeit", d(10), None, 1),
        (3, "60% Mandanten aktiv im Portal", "offen", d(60), None, 2),
    ]
    # Project 4: Belegerfassung (all done)
    milestones += [
        (4, "OCR-Software evaluiert", "done", "2025-06-15", "2025-06-14", 0),
        (4, "Pilotphase 10 Mandanten", "done", "2025-08-01", "2025-07-30", 1),
        (4, "Rollout alle Mandanten", "done", "2025-10-15", "2025-10-12", 2),
        (4, "Schulung + Dokumentation", "done", "2025-11-15", "2025-11-10", 3),
    ]
    for proj_id, name, status, due, completed, sort in milestones:
        db.execute(
            """INSERT INTO milestones (project_id, name, status, due_date, completed_at, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (proj_id, name, status, due, completed, sort),
        )

    # --- KPIs ---
    kpis = [
        (1, "Abschluesse fertig", "12", "von 28", 0),
        (1, "Fristeneinhaltung", "100", "%", 1),
        (1, "Fehlerquote", "1.8", "%", 2),
        (2, "Mandanten migriert", "0", "von 85", 0),
        (2, "Team-Schulungen", "0", "von 3", 1),
        (3, "Mandanten im Portal", "8", "von 85", 0),
        (4, "Erkennungsrate", "85", "%", 0),
        (4, "Mandanten aktiv", "72", "von 85", 1),
    ]
    for proj_id, label, value, unit, sort in kpis:
        db.execute(
            "INSERT INTO kpis (project_id, label, value, unit, sort_order) VALUES (?, ?, ?, ?, ?)",
            (proj_id, label, value, unit, sort),
        )

    # --- Jour Fixe Sessions ---
    jf1_started = past_datetime(9, 1)
    jf1_completed = past_datetime(9)
    jf2_started = past_datetime(5, 1)
    jf2_completed = past_datetime(5)

    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (1, 1, ?, ?, 'Sabine ist fokussiert auf die Abschluss-Saison. DATEV-Migration braucht mehr Aufmerksamkeit, Schulung verschoben.', 4)""",
        (jf1_started, jf1_completed),
    )
    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (2, 2, ?, ?, 'Nina arbeitet zuverlaessig, aber die Doppelbelastung aus Tagesgeschaeft und DATEV-Migration ist spuerbar.', 3)""",
        (jf2_started, jf2_completed),
    )

    # --- JF Project Notes ---
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (1, 1, '12 Abschluesse fristgerecht versendet. Bei 3 Mandanten fehlen noch Belege — Mahnung ist raus.', 'Feedback')"""
    )
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (2, 2, 'DATEV-Schulung muss nachgeholt werden. Nina braucht mindestens 2 Tage Einarbeitungszeit.', 'Eskalation')"""
    )

    # --- Notes ---
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (1, ?, 'Sabine ist fokussiert auf die Abschluss-Saison. DATEV-Migration braucht mehr Aufmerksamkeit, Schulung verschoben.', 'jourfix', 1, 'Feedback', ?)""",
        (past(9), jf1_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (2, ?, 'Nina arbeitet zuverlaessig, aber die Doppelbelastung aus Tagesgeschaeft und DATEV-Migration ist spuerbar.', 'jourfix', 2, 'Feedback', ?)""",
        (past(5), jf2_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (1, ?, 'Sabine ueberlegt Fachberaterin fuer Internationales Steuerrecht zu werden — Mandantenstamm waechst international', 'general', 'Entwicklung', ?)""",
        (past(7), past_datetime(7)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (3, ?, 'Janina hat eigenstaendig Kontierungsfehler in 3 Buchungsstapeln gefunden — gutes Auge fuer Details', 'general', 'Lob', ?)""",
        (past(3), past_datetime(3)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (2, ?, 'Nina moechte Bilanzbuchhalterin IHK machen. Foerdermoeglichkeiten und Freistellung pruefen.', 'general', 'Entwicklung,Idee', ?)""",
        (past(14), past_datetime(14)),
    )

    # --- Agreements ---
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (1, 2, 'DATEV-Schulungstermin fuer das Team festlegen', 'offen', ?, ?, 1)""",
        (past(2), jf1_completed),  # OVERDUE
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (2, 1, 'Fehlende Belege bei 3 Mandanten nachtelefonieren', 'offen', ?, ?, 2)""",
        (d(5), jf2_completed),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, content, status, due_date, created_at)
           VALUES (3, 'Berichtsheft auf aktuellem Stand halten und zur Pruefung vorlegen', 'offen', ?, ?)""",
        (d(10), past_datetime(4)),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, completed_at, jourfix_id)
           VALUES (1, 4, 'OCR-Dokumentation fuer Mandanten erstellen', 'erledigt', ?, ?, ?, 1)""",
        (past(20), past_datetime(30), past(22)),
    )

    # --- Goals ---
    goals = [
        (1, "Fachberaterin Internationales Steuerrecht", "Zertifizierung ueber StBK, 18-monatiger Lehrgang", "in_arbeit", "fachlich", d(180), "2026"),
        (1, "Mandantenstamm um 10% steigern", "Durch Empfehlungsmarketing und Mandantenportal neue Mandanten gewinnen", "offen", "persoenlich", d(120), "2026"),
        (2, "Bilanzbuchhalterin IHK", "Berufsbegleitende Weiterbildung, Pruefung im Herbst", "in_arbeit", "fachlich", d(150), "2026"),
        (2, "DATEV DUO Key-User werden", "Vertiefte Kenntnisse fuer die Migration und interne Schulung", "offen", "persoenlich", d(60), "2026"),
        (3, "Zwischenpruefung mit Note 2 oder besser", "Gezielte Vorbereitung auf die Zwischenpruefung im Sommer", "offen", "fachlich", d(90), "2026"),
    ]
    for emp_id, title, desc, status, cat, due, period in goals:
        db.execute(
            """INSERT INTO goals (employee_id, title, description, status, category, due_date, period)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (emp_id, title, desc, status, cat, due, period),
        )

    # --- Development Plan (Sabine) ---
    db.execute(
        """INSERT INTO development_plans (id, employee_id, period, summary,
               reflexion_tasks, reflexion_successes, reflexion_challenges, reflexion_focus,
               performance_rating, change_interest, change_interest_details,
               talent_pool, mobility_willing, mobility_scope, mobility_locations, remarks,
               created_at, updated_at)
           VALUES (1, 1, '2026',
               'Sabine ist eine erfahrene Steuerberaterin mit Partnerpotenzial. Fokus auf Spezialisierung und Kanzleientwicklung.',
               'Mandantenbetreuung (85 Mandanten), Jahresabschluesse, Kanzleifuehrung, Ausbildung Janina',
               'Digitale Belegerfassung erfolgreich eingefuehrt. Mandantenzufriedenheit 4.7/5. Zwei Grosskunden gewonnen.',
               'DATEV-Migration braucht mehr Zeit als geplant. Work-Life-Balance in der Abschluss-Saison schwierig.',
               'Internationale Steuerberatung als zweites Standbein, Kanzlei digitaler aufstellen',
               'B - Uebertrifft die Anforderungen', 'option_a', '',
               '', 0, '', '', 'Sabine ist die fachliche Saeuele der Kanzlei. Spezialisierung auf internationales Steuerrecht wuerde USP schaffen.',
               ?, ?)""",
        (now, now),
    )

    # Strengths
    strengths = [
        (1, "Fachliche Tiefe — beherrscht komplexe steuerliche Sachverhalte souveraen", 0),
        (1, "Mandantenvertrauen — langjaehrige Mandanten schaetzen ihre persoenliche Betreuung", 1),
        (1, "Digitalisierungsaffinitaet — treibt die technische Modernisierung der Kanzlei voran", 2),
    ]
    db.executemany(
        "INSERT INTO dev_strengths (plan_id, content, sort_order) VALUES (?, ?, ?)",
        strengths,
    )

    # Dev Areas
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (1, 1, 'Kanzleifuehrung', 'Personalfuehrung, Kanzleiorganisation, Qualitaetsmanagement, Strategie', 'hoch', 0)"""
    )
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (2, 1, 'Digitalisierungskompetenz', 'DATEV Cloud, Mandantenportal, digitale Prozesse optimieren', 'mittel', 1)"""
    )

    # Measures (1 overdue!)
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Kanzleimanagement-Seminar bei der StBK buchen', 'offen', ?)""",
        (past(5),),  # OVERDUE
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Quartalsziele fuer die Kanzlei definieren und kommunizieren', 'in_arbeit', ?)""",
        (d(20),),
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (2, 'DATEV DUO Admin-Schulung fuer Kanzleileitung', 'offen', ?)""",
        (d(30),),
    )

    # Trainings
    trainings = [
        (1, "Fachberaterin Internationales Steuerrecht (StBK)", "genehmigt", "Steuerberaterkammer", "4.800 EUR", d(90), None, 0),
        (1, "DATEV DUO — Umstiegskurs fuer Kanzleileitung", "abgeschlossen", "DATEV", "890 EUR", past(20), past(18), 1),
        (1, "Mandantenkommunikation und Akquise", "vorgeschlagen", "DStV", "590 EUR", d(60), None, 2),
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
           VALUES (1, 2, 'DATEV-Migration: Schulungstermin und Reihenfolge der Mandanten festlegen', ?)""",
        (past_datetime(1),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, content, created_at)
           VALUES (2, 'Bilanzbuchhalterin IHK — Freistellung und Kostenuebernahme besprechen', ?)""",
        (past_datetime(2),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, project_id, content, created_at)
           VALUES (3, 1, 'Zuarbeit Jahresabschluesse — Aufgaben fuer naechste Woche klaren', ?)""",
        (past_datetime(0, 5),),
    )
