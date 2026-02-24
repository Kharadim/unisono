# Unisono — Funktionsmatrix & Datenfluss

> Wo wird was erstellt, bearbeitet und angezeigt? Wie haengen die Module zusammen?
> Stand: v1.0.3 (Feb 2026)

---

## Inhaltsverzeichnis

1. [Uebersicht: Wer schreibt wo?](#uebersicht)
2. [Mitarbeiter](#mitarbeiter)
3. [Projekte](#projekte)
4. [Milestones](#milestones)
5. [KPIs](#kpis)
6. [Vereinbarungen](#vereinbarungen)
7. [Ziele (Zielvereinbarungen)](#ziele)
8. [Entwicklungsplan (STEPs)](#entwicklungsplan)
9. [Notizen](#notizen)
10. [JF-Agenda (Vorbereitung)](#jf-agenda)
11. [Jour Fixe Session](#jour-fixe-session)
12. [Stimmung (Mood)](#stimmung)
13. [Tags](#tags)
14. [Dashboard & Aufmerksamkeits-Radar](#dashboard)
15. [KI-Integration](#ki-integration)
16. [Datenfluss-Diagramme](#datenfluesse)

---

## Uebersicht

### Schnellreferenz: Wo kann ich was tun?

| Datentyp | Erstellen | Bearbeiten | Toggeln/Status | Anzeige (read-only) |
|----------|-----------|------------|----------------|---------------------|
| **Mitarbeiter** | Sidebar | Employee-Seite | — | Dashboard, Sidebar, Projekt-Team |
| **Projekte** | Employee-Seite | Projektseite | Status-Dropdown | Dashboard, Employee-Uebersicht |
| **Milestones** | Projektseite, JF | Projektseite, JF | Projektseite (3er-Cycle) | Dashboard (Fortschritt), JF-Protokoll |
| **KPIs** | Projektseite, JF | Projektseite, JF | — | Dashboard, JF-Protokoll |
| **Vereinbarungen** | Employee-Seite, JF | Employee-Seite, Projektseite | Employee + Projektseite, JF | Dashboard (Overdue), JF-Rueckblick |
| **Ziele** | Employee > Entwicklung | Employee > Entwicklung | Employee + JF | JF-Protokoll |
| **Dev-Plan** | Employee > Entwicklung | Employee > Entwicklung | — | JF-Protokoll, JF-Seitenleiste |
| **Staerken** | Employee > Entwicklung | Employee > Entwicklung | — | — |
| **Entw.-Felder** | Employee > Entwicklung | Employee > Entwicklung | — | JF-Protokoll |
| **Massnahmen** | Employee > Entwicklung | Employee > Uebersicht + Entwicklung | Employee-Uebersicht, JF | JF-Protokoll, Dashboard (Overdue) |
| **Weiterbildungen** | Employee > Entwicklung | Employee > Entwicklung | Employee + JF | JF-Protokoll |
| **Notizen** | Employee > Notizen, JF | Employee > Notizen | — | Projektseite (JF-Notizen) |
| **JF-Agenda** | Employee > Uebersicht | — | JF (abhaken) | JF-Seitenleiste |
| **Stimmung** | JF | JF | — | Employee-Header, Dashboard, JF-Protokoll |
| **Tags** | Sidebar > Tag-Verwaltung | Sidebar > Tag-Verwaltung | — | Notizen, JF-Notizen (als Badges) |

---

## Mitarbeiter

**DB:** `employees`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Sidebar → "+" Button | Name eingeben → Enter |
| **Bearbeiten** | Employee-Seite → Stift-Icon im Header | Formular: Name, Rolle, Abteilung, Start, Geburtstag, Verantwortlichkeiten, Persoenliches |
| **Foto** | Employee-Seite → Hover auf Avatar | Datei-Upload (JPG, PNG, WebP) |
| **Loeschen** | Employee-Seite → Papierkorb-Icon | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Dashboard:** Team-Bubbles (Avatar, Name, Rolle, JF-Indikator, Geburtstag-Badge, Jahrestag-Badge, Stimmung)
- **Dashboard:** Aufmerksamkeits-Radar (Score + Signale)
- **Dashboard:** Projekt-Karten (Member-Avatars)
- **Sidebar:** Mitarbeiter-Liste (Avatar + Name)
- **Projektseite:** Team-Section
- **JF-Protokoll:** Header (Name, Rolle, Abteilung)
- **KI-Chat:** Wird als Kontext mitgesendet

**Besonderheiten:**
- Geburtstag: Dashboard zeigt Countdown ("In X Tagen") fuer die naechsten 14 Tage
- Jahrestag: Dashboard zeigt "X Jahre — In Y Tagen" fuer die naechsten 30 Tage
- Foto wird als Datei gespeichert (nicht BLOB), Fallback = Initialen-Avatar

---

## Projekte

**DB:** `projects`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee-Seite → Uebersicht → "+ Projekt" | Dialog: Name + Scope, MA wird automatisch zugewiesen |
| **Bearbeiten** | Projektseite → Stift-Icon | Formular: Name, Scope, Status, Statuszeile |
| **Status aendern** | Projektseite → Dropdown | aktiv ↔ pausiert ↔ abgeschlossen |
| **Statuszeile** | Projektseite (inline) ODER JF | Freitext, wird auf Projektkarte angezeigt |
| **Team verwalten** | Projektseite → Team-Section | MA hinzufuegen/entfernen, Projektrolle setzen |
| **Loeschen** | Projektseite → Papierkorb | ConfirmDialog (loescht alles: Milestones, KPIs, Notizen) |

**Wo ueberall angezeigt:**
- **Dashboard:** Projekt-Karten gruppiert nach Abteilung (Name, Status-Badge, Statuszeile, Milestone-Balken, Overdue-Alert, Member-Avatars)
- **Employee-Seite:** Uebersicht-Tab als Karten (offene + abgeschlossene getrennt)
- **JF-Seite:** Projekt-Akkordeons (alle aktiven Projekte des MA)

**Besonderheiten:**
- Status-Wechsel wird automatisch in `status_history` geloggt
- Abgeschlossene Projekte sind auf Employee-Seite eingeklappt
- Dashboard gruppiert nach Abteilung der Team-Mitglieder

---

## Milestones

**DB:** `milestones` — Status-Cycle: `offen` → `in_arbeit` → `done`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Projektseite → "+ Milestone" | Name + Faelligkeitsdatum |
| | JF → Projekt-Akkordeon → "+ Milestone" | Name + Faelligkeitsdatum (im Changeset) |
| **Name/Datum bearbeiten** | Projektseite → Stift-Icon | Inline: Name + Datum → Speichern *(neu in v1.0.3)* |
| | JF → Projekt-Akkordeon | Inline im Changeset |
| **Status toggeln** | Projektseite → Kreis-Icon | offen → in_arbeit → done → offen |
| | JF → Projekt-Akkordeon → Toggle | Gleicher Cycle |
| **Reihenfolge** | Projektseite → Pfeil-Buttons | Hoch/Runter |
| **Loeschen** | Projektseite → Papierkorb | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Projektseite:** Milestone-Liste (Name, Status-Badge, Faelligkeitsdatum, Overdue-Markierung)
- **Dashboard:** Projekt-Karte zeigt Fortschrittsbalken (X/Y done) + Overdue-Zaehler rot
- **JF-Seite:** Im Projekt-Akkordeon als editierbare Liste
- **JF-Protokoll:** "Neue Milestones" Section
- **JF-Rueckblick:** "Abgeschlossene Milestones" + "Bearbeitete Milestones" *(neu in v1.0.3)*
- **Aufmerksamkeits-Radar:** Overdue-Milestones erhoehen Score (+1 pro Stueck)

**Besonderheiten:**
- `completed_at` wird automatisch gesetzt wenn Status = done
- `updated_at` wird gesetzt bei Name-/Datum-Aenderung ausserhalb JF *(v1.0.3)*
- Overdue = rot markiert wenn `status != 'done' AND due_date < heute AND due_date != ''`
- **Achtung SQLite:** Leerer String `''` < `date('now')` ist TRUE! Queries brauchen `AND due_date != ''`

---

## KPIs

**DB:** `kpis` + `kpi_history`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Projektseite → "+ KPI" | Label + Wert + Einheit |
| | JF → Projekt-Akkordeon → "+ KPI" | Label + Wert + Einheit (Changeset) |
| **Bearbeiten** | Projektseite → Stift-Icon | Inline: Label, Wert, Einheit |
| | JF → Projekt-Akkordeon → Wert-Feld | Direkt editierbar (Changeset) |
| **Verlauf ansehen** | Projektseite → Uhr-Icon | Dialog mit Timeline (alt → neu) |
| **Loeschen** | Projektseite → Papierkorb | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Projektseite:** KPI-Liste (Label, Wert + Einheit, Verlauf-Link)
- **JF-Seite:** Im Projekt-Akkordeon als editierbares Feld
- **JF-Rueckblick:** "KPI-Aenderungen" (alt → neu mit Projekt-Badge)

**Besonderheiten:**
- **Wert ist TEXT** — auch "80%", "45,2", "launched" sind moeglich
- **History:** Jede Aenderung via JF-Changeset erstellt History-Eintrag (old → new)
- **Wichtig:** Manuelle Aenderungen auf der Projektseite erstellen KEINE History — nur JF-Aenderungen

---

## Vereinbarungen

**DB:** `agreements` — Status: `offen` ↔ `erledigt`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Uebersicht → "+ Vereinbarung" | Content + Datum + optional Projekt |
| | JF → Seitenleiste → "Neue Vereinbarung" | Content + Datum + Projekt (Changeset) |
| **Bearbeiten** | Employee > Uebersicht → Stift-Icon (hover) | Inline: Content + Datum + Projekt |
| | Projektseite → Stift-Icon (hover) | Inline: Content + Datum *(neu in v1.0.3)* |
| **Status toggeln** | Employee > Uebersicht → Kreis-Icon | offen ↔ erledigt |
| | Projektseite → Kreis-Icon | offen ↔ erledigt |
| | JF → Seitenleiste → Toggle | offen ↔ erledigt (Changeset) |
| **Loeschen** | Employee > Uebersicht → Papierkorb (hover) | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Uebersicht-Tab → "Offene Punkte" Card (offene + ueberfaellige + erledigte eingeklappt)
- **Projektseite:** Vereinbarungen-Section (alle MA, offene + erledigte)
- **Dashboard:** Overdue-Zaehler auf Stats-Karte (Hover zeigt Details)
- **JF-Seite:** Seitenleiste → "Offene Punkte" mit Toggle
- **JF-Rueckblick:** "Erledigte Vereinbarungen" + "Bearbeitete Vereinbarungen" *(v1.0.3)*
- **JF-Protokoll:** "Neue Vereinbarungen" (nur aus dieser Session)
- **Aufmerksamkeits-Radar:** Overdue-Vereinbarungen erhoehen Score (+2 pro Stueck)

**Besonderheiten:**
- Koennen mit oder ohne Projekt-Zuordnung erstellt werden
- `jourfix_id` trackt ob aus JF erstellt
- `updated_at` wird bei Inhaltsaenderung gesetzt *(v1.0.3)*
- Auf Projektseite werden Vereinbarungen aller MA dieses Projekts gezeigt

---

## Ziele

**DB:** `goals` — Status: `offen` → `in_arbeit` → `erreicht` / `nicht_erreicht`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Entwicklung → "+ Ziel" | Dialog: Titel, Beschreibung, Kategorie, Datum, Periode |
| **Bearbeiten** | Employee > Entwicklung → Stift-Icon | Inline Dialog |
| **Status toggeln** | Employee > Entwicklung → Cycle-Button | offen → in_arbeit → erreicht → offen |
| | JF → Seitenleiste → Toggle | Gleicher Cycle (Changeset) |
| **Nicht erreicht** | Employee > Entwicklung → Ban-Button | Setzt direkt auf "nicht_erreicht" |
| **Loeschen** | Employee > Entwicklung → Papierkorb | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Entwicklung-Tab → "Zielvereinbarungen" Card (gruppiert nach Periode)
- **JF-Seite:** Seitenleiste → Ziele mit Status-Toggle
- **JF-Protokoll:** "Aktuelle Ziele" Tabelle

**Besonderheiten:**
- 3 Kategorien: fachlich (gruen), persoenlich (blau), fuehrung (rot)
- Gruppiert nach Periode (z.B. "2026") — aeltere eingeklappt

---

## Entwicklungsplan

**DB:** `development_plans` + `dev_strengths` + `dev_areas` + `dev_measures` + `dev_trainings`

Der Entwicklungsplan ist ein Container mit 4 Unter-Typen:

### Plan-Ebene

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Entwicklung → "+ Neuer Plan" | Periode angeben (z.B. "2026") |
| **Bearbeiten** | Employee > Entwicklung | Reflexion (4 Textfelder), Leistungseinschaetzung, Talentpool, Anmerkungen |
| **Loeschen** | Employee > Entwicklung → Papierkorb | CASCADE: loescht Staerken, Felder, Massnahmen, Weiterbildungen |

### Staerken

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Entwicklung → Plan → "+ Staerke" | Inline Input |
| **Bearbeiten** | Employee > Entwicklung → Stift-Icon | Inline Input |
| **Loeschen** | Employee > Entwicklung → Papierkorb | Direkt |

### Entwicklungsfelder + Massnahmen

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Feld erstellen** | Employee > Entwicklung → "+ Entwicklungsfeld" | Dialog: Titel, Beschreibung, Prioritaet |
| **Massnahme erstellen** | Employee > Entwicklung → im Feld → "+ Massnahme" | Content + Datum |
| **Massnahme bearbeiten** | Employee > Uebersicht → Stift-Icon (hover) | Inline: Content + Datum *(neu in v1.0.3)* |
| | Employee > Entwicklung | Inline |
| **Massnahme toggeln** | Employee > Uebersicht → Kreis-Icon | offen → in_arbeit → erledigt |
| | JF → Seitenleiste → Toggle | Changeset |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Entwicklung-Tab → Plan-Card (Staerken, Felder mit Massnahmen, Weiterbildungen)
- **Employee-Seite:** Uebersicht-Tab → "Offene Punkte" Card (offene Massnahmen neben Vereinbarungen)
- **JF-Seite:** Seitenleiste → Massnahmen + Weiterbildungen mit Toggle
- **JF-Protokoll:** STEPs-Zusammenfassung + Entwicklungsfelder + Weiterbildungen
- **JF-Rueckblick:** "Bearbeitete Massnahmen" *(v1.0.3)*
- **Aufmerksamkeits-Radar:** +1 pro ueberfaellige Massnahme, +1 wenn kein Plan existiert, +1 wenn STEPs (Leistungseinschaetzung) offen

### Weiterbildungen

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Entwicklung → "+ Weiterbildung" | Content, Anbieter, Kosten, Datum |
| **Bearbeiten** | Employee > Entwicklung | Inline |
| **Status toggeln** | Employee > Entwicklung | vorgeschlagen → genehmigt → abgeschlossen |
| | JF → Seitenleiste → Toggle | Changeset |

---

## Notizen

**DB:** `notes` — Typ: `general` (manuell) oder `jourfix` (aus JF)

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen (manuell)** | Employee > Notizen → Textarea | Text + Tags → Speichern |
| **Erstellen (aus JF)** | JF → "Allgemeine Notizen" Textarea | Wird beim Abschliessen als Notiz mit type=jourfix gespeichert |
| **Bearbeiten** | Employee > Notizen → Stift-Icon (hover) | Inline: Text + Tags |
| **Loeschen** | Employee > Notizen → Papierkorb (hover) | ConfirmDialog |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Notizen-Tab (gruppiert nach Monat, neuester Monat offen, aeltere eingeklappt)
  - JF-Notizen: Badge "Jour Fixe" + farbiger Rand
  - Manuelle Notizen: Normal
  - Tag-Filter moeglich
- **KI-Chat:** Letzte 10 Notizen als Kontext (gekuerzt auf 200 Zeichen)

**Zwei getrennte Notiz-Typen im JF:**

| Typ | Erstellt in | Gespeichert als | Angezeigt auf |
|-----|-------------|-----------------|---------------|
| **Allgemeine Notizen** | JF → Textarea unten | `notes` mit type=jourfix | Employee > Notizen-Tab |
| **Projekt-Notizen** | JF → Pro Projekt-Akkordeon | `jourfix_project_notes` | **Projektseite** → "JF-Notizen" Section |

→ Das heisst: **Projekt-Notizen aus dem JF erscheinen auf der Projektseite**, nicht auf der Notizen-Seite des Mitarbeiters!

---

## JF-Agenda

**DB:** `jourfix_agenda`

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Erstellen** | Employee > Uebersicht → "JF-Vorbereitung" Section | Thema + optional Projekt-Zuordnung |
| **Abhaken** | JF → Seitenleiste → Checkbox | Setzt `discussed_at` |
| **Loeschen** | Employee > Uebersicht → Papierkorb (hover) | Direkt |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Uebersicht-Tab → "JF-Vorbereitung" Card
- **JF-Seite:** Seitenleiste → Agenda-Punkte mit Checkboxen

**Besonderheiten:**
- Nur offene Punkte werden auf Employee-Seite angezeigt
- Im JF werden ALLE Punkte gezeigt (auch bereits besprochene)
- Projekt-Zuordnung ist optional

---

## Jour Fixe Session

**DB:** `jourfix_sessions`

### Lifecycle

```
1. Employee-Seite → "Jour Fixe" Button klicken
   ↓
2. Falls offene Session: "Fortsetzen oder neue starten?"
   ↓
3. JF-Seite oeffnet: 2-Spalten-Layout
   ├── Links: Projekt-Akkordeons (Milestones, KPIs, Statuszeile)
   └── Rechts: Seitenleiste (Agenda, Offene Punkte, Ziele, Massnahmen, Stimmung, Notizen)
   ↓
4. Alle Aenderungen werden LOKAL gesammelt (kein API-Call beim Editieren)
   Auto-Save alle 2s in localStorage (Crash-Schutz)
   ↓
5. "Abschliessen" → ALLES wird in EINER Transaktion gespeichert:
   - Milestone-Status/Name/Datum
   - KPI-Werte (+ History)
   - Projekt-Status + Statuszeile
   - Neue Milestones/KPIs/Vereinbarungen
   - Vereinbarungs-/Ziel-/Massnahmen-/Weiterbildungs-Status
   - Projekt-Notizen → jourfix_project_notes
   - Allgemeine Notizen → notes (type=jourfix)
   - Stimmung
   ↓
6. Weiterleitung zu Protokoll-Seite (druckbar)
```

### JF-Rueckblick (Recap)

Wird beim naechsten JF-Start automatisch geladen. Zeigt alles was **seit dem letzten JF** passiert ist:

| Section | Quelle | Bedingung |
|---------|--------|-----------|
| Erledigte Vereinbarungen | `agreements` | `completed_at > letztes_jf` |
| Abgeschlossene Milestones | `milestones` | `completed_at > letztes_jf` |
| KPI-Aenderungen | `kpi_history` | `changed_at > letztes_jf` |
| Bearbeitete Milestones | `milestones` | `updated_at > letztes_jf` *(v1.0.3)* |
| Bearbeitete Vereinbarungen | `agreements` | `updated_at > letztes_jf` *(v1.0.3)* |
| Bearbeitete Massnahmen | `dev_measures` | `updated_at > letztes_jf` *(v1.0.3)* |

### JF-Protokoll

Druckbare Seite (`/jourfix/:id/protocol`) mit:
- MA-Name, Rolle, Abteilung, Datum, Stimmung
- Allgemeine Notizen + Tags
- Projekt-Notizen + Tags
- Neue Vereinbarungen
- Aktuelle Ziele
- Entwicklungsfelder + offene Massnahmen
- STEPs-Zusammenfassung (Leistung + Talentpool)
- Aktive Weiterbildungen

---

## Stimmung

**DB:** `jourfix_sessions.mood` (1-5, nullable)

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Setzen** | JF → Seitenleiste → Emoji-Buttons | 5 Stufen: 😞 😕 😐 🙂 😊 |

**Wo ueberall angezeigt:**
- **Employee-Seite:** Header → MoodTrend (letzte 8 JFs als Mini-Emojis, neuester opak, aeltere transparent)
- **Dashboard:** Team-Bubbles zeigen letzte Stimmung
- **JF-Protokoll:** Header ("Stimmung: Emoji + Label")
- **Aufmerksamkeits-Radar:**
  - +3 wenn letzte Stimmung 1-2 (schlecht)
  - +2 wenn Stimmung ueber 3 JFs sinkt

---

## Tags

**DB:** `tag_definitions` (7 Defaults: Feedback, Entwicklung, Lob, Konflikt, Eskalation, Vereinbarung, Idee)

| Aktion | Wo | Wie |
|--------|-----|-----|
| **Verwalten** | Sidebar → "Tag-Verwaltung" | Name + Farbe, Reihenfolge aendern, loeschen |

**Verwendet in:**
- Notizen (Employee > Notizen-Tab) → beim Erstellen/Bearbeiten als Checkbox-Auswahl
- JF-Notizen (allgemein + pro Projekt) → beim Erstellen im JF
- Angezeigt als farbige Badges unter Notizen/JF-Notizen

**Besonderheiten:**
- Tags sind komma-getrennte Strings in der DB (kein Foreign-Key!)
- Wenn ein Tag geloescht wird, entfernt Backend den Namen aus allen existierenden Notizen
- Tag-Filter auf Notizen-Tab filtert nach enthaltenen Tag-Namen

---

## Dashboard

### Stats-Karten (oben)

| Karte | Berechnung |
|-------|------------|
| Team-Groesse | Anzahl Mitarbeiter |
| Aktive Projekte | Projekte mit Status != abgeschlossen |
| Ueberfaellige Vereinbarungen | Offene Vereinbarungen mit `due_date < heute` |

### Team-Bubbles

Pro Mitarbeiter werden angezeigt:
- Avatar + Name + Rolle
- JF-Indikator: Gruen (≤14d), Orange (>14d), Rot (>28d) seit letztem JF
- Stimmung aus letztem JF (Emoji)
- Geburtstag-Badge (naechste 14 Tage)
- Jahrestag-Badge (naechste 30 Tage)

### Projekt-Karten (nach Abteilung)

Pro Projekt: Name, Status-Badge, Statuszeile, Milestone-Fortschrittsbalken, Overdue-Alert, Team-Avatars (max 4 + "+X")

### Aufmerksamkeits-Radar

Scoring-System pro Mitarbeiter — zeigt wo Handlungsbedarf besteht:

| Signal | Punkte | Bedingung |
|--------|--------|-----------|
| JF ueberfaellig | +2 | Letztes JF > 14 Tage, +3 wenn > 28 Tage |
| Schlechte Stimmung | +3 | Letzte Stimmung 1-2 |
| Stimmung sinkt | +2 | Ueber 3 JFs fallend |
| Ueberfaellige Vereinbarungen | +2/Stueck | `due_date < heute` |
| Ueberfaellige Milestones | +1/Stueck | In MA-Projekten |
| Ueberfaellige Massnahmen | +1/Stueck | Dev-Measures |
| Kein Entwicklungsplan | +1 | Kein Plan vorhanden |
| STEPs offen | +1 | Plan ohne Leistungseinschaetzung |

Badge-Farben: Rot (≥7), Orange (≥4), Gelb (<4)

---

## KI-Integration

### Chat-Widget

- Verfuegbar auf jeder Seite (Sidebar-Button "KI-Assistent")
- Sendet automatisch Kontext basierend auf aktueller Seite:

| Seite | Kontext der mitgesendet wird |
|-------|------------------------------|
| **Dashboard** | Team-Uebersicht, aktive Projekte, Overdue-Vereinbarungen |
| **Employee-Seite** | MA-Details, letzte 10 Notizen, JF-Projekt-Notizen, offene Vereinbarungen, Ziele, DevPlan (Staerken, Felder, Massnahmen), letzte 3 Stimmungen |
| **Projektseite** | Projekt-Details, Team-Mitglieder, Milestones, KPIs |

### KI-JF-Briefing

- Employee-Seite → "JF vorbereiten" Button (nur wenn KI konfiguriert)
- Sammelt: Recap seit letztem JF + offene Punkte + Entwicklungsstand
- KI formuliert: Rueckblick, offene Themen, Entwicklungs-Empfehlung, Gespraechsvorschlaege, Aktionen

### Provider

| Option | Daten | Qualitaet |
|--------|-------|-----------|
| Keine KI | Lokal | — |
| Ollama (lokal) | Bleiben auf Rechner | Begrenzt (8B Modelle) |
| Cloud (Gemini/OpenAI/Anthropic) | Werden an API gesendet | Hoch |

Cloud-Consent: Beim ersten Cloud-Call erscheint Warnung welche MA-Daten gesendet werden.

---

## Datenfluesse

### Wo entstehen Daten → Wo tauchen sie auf?

```
JF-Session (Abschluss)
  ├─→ Milestone-Status       → Projektseite, Dashboard (Fortschritt)
  ├─→ KPI-Werte              → Projektseite + kpi_history
  ├─→ Projekt-Status         → Projektseite, Dashboard + status_history
  ├─→ Neue Milestones/KPIs   → Projektseite
  ├─→ Neue Vereinbarungen    → Employee-Uebersicht, Projektseite
  ├─→ Status-Aenderungen     → Employee-Uebersicht (Vereinbarungen, Ziele, Massnahmen)
  ├─→ Allgemeine Notizen     → Employee > Notizen-Tab (type=jourfix)
  ├─→ Projekt-Notizen        → Projektseite > "JF-Notizen"  ← NICHT Employee-Notizen!
  └─→ Stimmung               → Employee-Header, Dashboard, Radar
```

```
Manuelle Aenderung (ausserhalb JF)
  ├─→ Milestone bearbeitet   → updated_at gesetzt → naechster JF-Rueckblick
  ├─→ Vereinbarung bearbeitet→ updated_at gesetzt → naechster JF-Rueckblick
  ├─→ Massnahme bearbeitet   → updated_at gesetzt → naechster JF-Rueckblick
  ├─→ Vereinbarung erledigt  → completed_at gesetzt → naechster JF-Rueckblick
  └─→ Milestone erledigt     → completed_at gesetzt → naechster JF-Rueckblick
```

```
Overdue-Items (Vereinbarungen, Milestones, Massnahmen)
  ├─→ Rote Markierung auf jeweiliger Seite
  ├─→ Dashboard Stats-Karte (Zaehler)
  └─→ Aufmerksamkeits-Radar (Score-Erhoehung)
```

### Wo werden Notizen angezeigt? (Haeufige Frage)

| Notiz-Typ | Erstellt in | Gespeichert in | Angezeigt auf |
|------------|-------------|----------------|---------------|
| Manuelle Notiz | Employee > Notizen | `notes` (type=general) | Employee > Notizen |
| JF Allgemein-Notiz | JF → Textarea unten | `notes` (type=jourfix) | Employee > Notizen (mit JF-Badge) |
| JF Projekt-Notiz | JF → Pro Projekt | `jourfix_project_notes` | **Projektseite** → "JF-Notizen" |
| JF Statuszeile | JF → Pro Projekt | `projects.status_text` | Projektseite Header + Dashboard |

→ **Merke:** Projekt-Notizen aus dem JF landen auf der **Projektseite**, NICHT beim Mitarbeiter!

---

## Bekannte Sonderfaelle

1. **KPI-History lueckenhaft:** Manuelle KPI-Aenderungen auf der Projektseite erzeugen keinen History-Eintrag — nur JF-Aenderungen
2. **Tags ohne Foreign Key:** Tags sind Strings in Notizen, keine DB-Relation. Umbenennen eines Tags aendert nicht bestehende Notizen
3. **Leere Datumsfelder:** `due_date` kann `''` sein (nicht NULL). SQLite: `'' < date('now')` = TRUE → alle Overdue-Queries pruefen `AND due_date != ''`
4. **Session-Token:** Wird bei Server-Neustart invalidiert → Nutzer muss sich neu einloggen
5. **Vereinbarungen auf Projektseite:** Koennen dort bearbeitet/getoggelt, aber NICHT erstellt werden (Backlog-Item)
