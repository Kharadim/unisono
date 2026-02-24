from backend.routers.demo.routes import register_template
from backend.routers.demo.helpers import (
    d, past, now_iso, past_datetime, generate_demo_photos,
)


@register_template("handwerk")
def insert(db):
    now = now_iso()

    # --- Generate demo photos ---
    photos = generate_demo_photos([
        (1, "Thomas Brenner", "https://randomuser.me/api/portraits/men/52.jpg", "#f59e0b"),
        (2, "Markus Vogt", "https://randomuser.me/api/portraits/men/41.jpg", "#10b981"),
        (3, "Leon Hartmann", "https://randomuser.me/api/portraits/men/3.jpg", "#8b5cf6"),
    ])

    # --- Employees ---
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (1, 'Thomas Brenner', 'Projektleiter / Meister', 'Elektrotechnik',
                   'Projektplanung, Kundenbetreuung, Angebotserstellung, Abnahmen',
                   '2018-04-01', '1985-03-22', '', ?, ?)""",
        (photos.get(1), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (2, 'Markus Vogt', 'Geselle Elektrotechnik', 'Elektrotechnik',
                   'Installation, Wartung, Stoerungsbehebung, Kundendienst',
                   '2021-08-15', '1992-07-14', '', ?, ?)""",
        (photos.get(2), now),
    )
    db.execute(
        """INSERT INTO employees (id, name, role, department, responsibilities, start_date, birthday, personal_notes, photo_path, created_at)
           VALUES (3, 'Leon Hartmann', 'Auszubildender 2. Lehrjahr', 'Elektrotechnik',
                   'Assistenz bei Installationen, Berichtsheft fuehren, Berufsschule',
                   '2024-09-01', '2005-11-03', '', ?, ?)""",
        (photos.get(3), now),
    )

    # --- Projects ---
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (1, 'Grossauftrag Neubau Schulzentrum',
                   'Komplette Elektroinstallation Neubau Schulzentrum: Beleuchtung, Netzwerk, Brandmeldeanlage, Sprechanlage. 3 Gebaeude, 45 Raeume.',
                   'aktiv', 'Rohbau-Phase, Kabeltrassen werden verlegt', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (2, 'Wartungsvertrag Stadtwerke',
                   'Jaehrliche Wartung und Pruefung der elektrischen Anlagen in 12 Liegenschaften der Stadtwerke. Inkl. E-Check und Dokumentation.',
                   'aktiv', 'Q1-Pruefungen laufen, 4 von 12 abgeschlossen', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (3, 'Digitalisierung Buero',
                   'Einfuehrung digitale Zeiterfassung, Auftragsmanagement-Software und papierlose Dokumentation fuer den Betrieb.',
                   'aktiv', 'Software ausgewaehlt, Schulung geplant', ?)""",
        (now,),
    )
    db.execute(
        """INSERT INTO projects (id, name, scope, status, status_text, created_at)
           VALUES (4, 'Azubi-Ausbildungsplan',
                   'Strukturierter Ausbildungsplan fuer Leon: Rotationseinsaetze, Berufsschul-Begleitung, Pruefungsvorbereitung Zwischenpruefung.',
                   'aktiv', 'Rotationsplan erstellt, erste Einsaetze laufen', ?)""",
        (now,),
    )

    # --- Project Members ---
    members = [
        (1, 1, "Projektleiter"),
        (1, 2, "Montage"),
        (1, 3, "Assistenz"),
        (2, 1, "Verantwortlich"),
        (2, 2, "Pruefer"),
        (3, 1, "Projektleiter"),
        (4, 1, "Ausbilder"),
        (4, 3, "Auszubildender"),
    ]
    db.executemany(
        "INSERT INTO project_members (project_id, employee_id, role_in_project) VALUES (?, ?, ?)",
        members,
    )

    # --- Milestones ---
    # Project 1: Schulzentrum (2 done, 1 in_arbeit, 2 offen)
    milestones = [
        (1, "Aufmass und Planung abgeschlossen", "done", past(30), past(32), 0),
        (1, "Kabeltrassen Gebaeude A verlegt", "done", past(10), past(11), 1),
        (1, "Kabeltrassen Gebaeude B und C", "in_arbeit", d(10), None, 2),
        (1, "Verteilerschraenke montiert", "offen", d(25), None, 3),
        (1, "Endmontage und Abnahme", "offen", d(50), None, 4),
    ]
    # Project 2: Wartungsvertrag (2 done, 1 OVERDUE, 1 offen)
    milestones += [
        (2, "Pruefplan Q1 erstellt", "done", past(40), past(42), 0),
        (2, "Liegenschaften 1-4 geprueft", "done", past(8), past(9), 1),
        (2, "Liegenschaften 5-8 geprueft", "offen", past(2), None, 2),  # OVERDUE
        (2, "Liegenschaften 9-12 + Dokumentation", "offen", d(20), None, 3),
    ]
    # Project 3: Digitalisierung (1 done, 1 in_arbeit, 1 offen)
    milestones += [
        (3, "Software-Evaluation abgeschlossen", "done", past(20), past(22), 0),
        (3, "Team-Schulung durchfuehren", "in_arbeit", d(7), None, 1),
        (3, "Go-Live digitale Zeiterfassung", "offen", d(21), None, 2),
    ]
    # Project 4: Azubi-Plan (1 done, 1 in_arbeit, 1 offen)
    milestones += [
        (4, "Rotationsplan erstellt", "done", past(15), past(16), 0),
        (4, "Einsatz Kundendienst (4 Wochen)", "in_arbeit", d(14), None, 1),
        (4, "Pruefungsvorbereitung Zwischenpruefung", "offen", d(45), None, 2),
    ]
    for proj_id, name, status, due, completed, sort in milestones:
        db.execute(
            """INSERT INTO milestones (project_id, name, status, due_date, completed_at, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (proj_id, name, status, due, completed, sort),
        )

    # --- KPIs ---
    kpis = [
        (1, "Projektmarge", "18", "%", 0),
        (1, "Materialkosten", "42.300", "EUR", 1),
        (1, "Nacharbeit-Quote", "2.1", "%", 2),
        (2, "Geprueft", "4", "von 12", 0),
        (2, "Maengelquote", "8", "%", 1),
        (3, "Schulungsteilnahme", "1", "von 3", 0),
        (4, "Ausbildungsfortschritt", "35", "%", 0),
        (4, "Berufsschul-Schnitt", "2.3", "Note", 1),
    ]
    for proj_id, label, value, unit, sort in kpis:
        db.execute(
            "INSERT INTO kpis (project_id, label, value, unit, sort_order) VALUES (?, ?, ?, ?, ?)",
            (proj_id, label, value, unit, sort),
        )

    # --- Jour Fixe Sessions ---
    jf1_started = past_datetime(8, 1)
    jf1_completed = past_datetime(8)
    jf2_started = past_datetime(6, 1)
    jf2_completed = past_datetime(6)

    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (1, 1, ?, ?, 'Thomas ist zufrieden mit dem Fortschritt am Schulzentrum. Stadtwerke-Pruefungen muessen beschleunigt werden.', 4)""",
        (jf1_started, jf1_completed),
    )
    db.execute(
        """INSERT INTO jourfix_sessions (id, employee_id, started_at, completed_at, general_notes, mood)
           VALUES (2, 2, ?, ?, 'Markus fuehlt sich mit den parallelen Baustellen etwas ueberfordert. Zeitplanung gemeinsam besprechen.', 3)""",
        (jf2_started, jf2_completed),
    )

    # --- JF Project Notes ---
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (1, 1, 'Kabeltrassen Gebaeude A termingerecht fertig. Material fuer B+C bestellt. Lieferzeit 2 Wochen.', 'Feedback')"""
    )
    db.execute(
        """INSERT INTO jourfix_project_notes (jourfix_id, project_id, notes, tags)
           VALUES (2, 2, 'Liegenschaften 5+6 naechste Woche einplanen. Markus braucht Unterstuetzung bei Dokumentation.', 'Vereinbarung')"""
    )

    # --- Notes ---
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (1, ?, 'Thomas ist zufrieden mit dem Fortschritt am Schulzentrum. Stadtwerke-Pruefungen muessen beschleunigt werden.', 'jourfix', 1, 'Feedback', ?)""",
        (past(8), jf1_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, jourfix_id, tags, created_at)
           VALUES (2, ?, 'Markus fuehlt sich mit den parallelen Baustellen etwas ueberfordert. Zeitplanung gemeinsam besprechen.', 'jourfix', 2, 'Feedback', ?)""",
        (past(6), jf2_completed),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (1, ?, 'Meisterpruefung Elektrotechnik — Thomas ueberlegt, Betriebswirt HWK draufzusetzen', 'general', 'Entwicklung', ?)""",
        (past(5), past_datetime(5)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (3, ?, 'Leon zeigt gute Eigeninitiative auf der Baustelle. Hat selbstaendig Kabelwege vorgezeichnet.', 'general', 'Lob', ?)""",
        (past(3), past_datetime(3)),
    )
    db.execute(
        """INSERT INTO notes (employee_id, date, content, type, tags, created_at)
           VALUES (2, ?, 'Markus interessiert sich fuer Smart-Home / KNX-Technik. Weiterbildung pruefen.', 'general', 'Entwicklung,Idee', ?)""",
        (past(12), past_datetime(12)),
    )

    # --- Agreements ---
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (1, 2, 'Pruefplan Stadtwerke Q1 aktualisieren und priorisieren', 'offen', ?, ?, 1)""",
        (past(3), jf1_completed),  # OVERDUE
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, jourfix_id)
           VALUES (2, 2, 'Dokumentation Liegenschaften 1-4 bis Freitag nachreichen', 'offen', ?, ?, 2)""",
        (d(5), jf2_completed),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, content, status, due_date, created_at)
           VALUES (3, 'Berichtsheft fuer Maerz nachfuehren und vorlegen', 'offen', ?, ?)""",
        (d(10), past_datetime(4)),
    )
    db.execute(
        """INSERT INTO agreements (employee_id, project_id, content, status, due_date, created_at, completed_at, jourfix_id)
           VALUES (1, 1, 'Materialliste Gebaeude B+C erstellen', 'erledigt', ?, ?, ?, 1)""",
        (past(15), past_datetime(25), past(17)),
    )

    # --- Goals ---
    goals = [
        (1, "Betriebswirt HWK abschliessen", "Berufsbegleitende Weiterbildung zum Betriebswirt des Handwerks", "in_arbeit", "fachlich", d(180), "2026"),
        (1, "Kundenzufriedenheit auf 4.5+ steigern", "Durch bessere Kommunikation und Termintreue bei allen Projekten", "offen", "persoenlich", d(90), "2026"),
        (2, "Eigenstaendig Kleinauftraege leiten", "Auftraege bis 5.000 EUR selbstaendig abwickeln inkl. Angebot und Abnahme", "in_arbeit", "fachlich", d(60), "2026"),
        (2, "KNX-Zertifizierung bestehen", "Smart-Home Grundkurs bei der Handwerkskammer", "offen", "persoenlich", d(120), "2026"),
        (3, "Zwischenpruefung mit Note 2 oder besser", "Gezielte Vorbereitung auf die Zwischenpruefung im Sommer", "offen", "fachlich", d(90), "2026"),
    ]
    for emp_id, title, desc, status, cat, due, period in goals:
        db.execute(
            """INSERT INTO goals (employee_id, title, description, status, category, due_date, period)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (emp_id, title, desc, status, cat, due, period),
        )

    # --- Development Plan (Thomas) ---
    db.execute(
        """INSERT INTO development_plans (id, employee_id, period, summary,
               reflexion_tasks, reflexion_successes, reflexion_challenges, reflexion_focus,
               performance_rating, change_interest, change_interest_details,
               talent_pool, mobility_willing, mobility_scope, mobility_locations, remarks,
               created_at, updated_at)
           VALUES (1, 1, '2026',
               'Thomas ist ein erfahrener Meister mit Potenzial zur Betriebsfuehrung. Fokus auf kaufmaennische Weiterbildung und Mitarbeiterfuehrung.',
               'Projektleitung Grossauftraege, Kundenbetreuung, Angebotserstellung, Ausbildung Leon',
               'Schulzentrum-Auftrag gewonnen (groesster Einzelauftrag). Alle Abnahmen Q4 ohne Beanstandung.',
               'Bueroarbeit und Dokumentation kosten viel Zeit. Delegation an Markus noch ausbaufaehig.',
               'Kaufmaennisches Know-how ausbauen, Fuehrung des wachsenden Teams verbessern',
               'B - Uebertrifft die Anforderungen', 'option_a', '',
               '', 0, '', '', 'Thomas ist der Rueckgrat des Betriebs. Betriebswirt-Abschluss wuerde perspektivisch Teilhaberschaft ermoeglichen.',
               ?, ?)""",
        (now, now),
    )

    # Strengths
    strengths = [
        (1, "Fachliche Exzellenz — loest auch komplexe Installationsprobleme zuverlaessig", 0),
        (1, "Kundenvertrauen — langjaerige Kunden schaetzen seine Zuverlaessigkeit", 1),
        (1, "Ausbilderkompetenz — bringt Nachwuchs geduldig und strukturiert weiter", 2),
    ]
    db.executemany(
        "INSERT INTO dev_strengths (plan_id, content, sort_order) VALUES (?, ?, ?)",
        strengths,
    )

    # Dev Areas
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (1, 1, 'Betriebsfuehrung', 'Kaufmaennische Grundlagen, Kalkulation, Betriebswirt HWK, Angebotswesen', 'hoch', 0)"""
    )
    db.execute(
        """INSERT INTO dev_areas (id, plan_id, title, description, priority, sort_order)
           VALUES (2, 1, 'Mitarbeiterfuehrung', 'Delegation, Feedbackgespraeche, Azubi-Betreuung professionalisieren', 'mittel', 1)"""
    )

    # Measures (1 overdue!)
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Betriebswirt HWK — Anmeldung und Kursstart', 'offen', ?)""",
        (past(5),),  # OVERDUE
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (1, 'Kalkulations-Workshop bei der Kreishandwerkerschaft', 'in_arbeit', ?)""",
        (d(30),),
    )
    db.execute(
        """INSERT INTO dev_measures (area_id, content, status, due_date)
           VALUES (2, 'Woechentliches Feedback-Gespraech mit Markus etablieren', 'offen', ?)""",
        (d(14),),
    )

    # Trainings
    trainings = [
        (1, "Betriebswirt des Handwerks (HWK)", "genehmigt", "Handwerkskammer", "3.200 EUR", d(60), None, 0),
        (1, "Elektrofachkraft fuer festgelegte Taetigkeiten — Auffrischung", "abgeschlossen", "DEKRA", "480 EUR", past(30), past(28), 1),
        (1, "Fuehrung im Handwerk — Tagesseminar", "vorgeschlagen", "Kreishandwerkerschaft", "290 EUR", d(45), None, 2),
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
           VALUES (1, 1, 'Materiallieferung Gebaeude B — Terminbestaetigung pruefen', ?)""",
        (past_datetime(1),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, content, created_at)
           VALUES (2, 'KNX-Schulung — Termin und Kosten absprechen', ?)""",
        (past_datetime(2),),
    )
    db.execute(
        """INSERT INTO jourfix_agenda (employee_id, project_id, content, created_at)
           VALUES (3, 4, 'Berichtsheft-Kontrolle und Einsatzplanung naechster Monat', ?)""",
        (past_datetime(0, 5),),
    )
