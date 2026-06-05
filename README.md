# Unisono 🤝

**Das lokale Führungs-Tool für Teamleads** — Mitarbeiter, Projekte und wöchentliche Jour-Fixe-Gespräche an einem Ort. Als native Desktop-App, deren Daten den eigenen Rechner nie verlassen.

> Privacy-by-Design: Keine Cloud, kein Account, kein Abo. Eine `.exe` installieren und loslegen.

## Was Unisono kann

### 👥 Mitarbeiter-Management
- Profile mit Foto, Rolle, Verantwortlichkeiten und persönlichen Notizen
- **Zielvereinbarungen** (fachlich / persönlich / Führung) mit Status-Tracking
- **Entwicklungspläne**: Stärken, Entwicklungsfelder, Maßnahmen und Weiterbildungen
- Notizen mit konfigurierbaren Tags, gruppiert nach Monat

### 📁 Projekt-Tracking
- Projekte mit Team-Zuordnung, Status und automatischer Änderungshistorie
- **Milestones** mit Fälligkeitsdaten und Overdue-Markierung
- **KPIs** mit Wertehistorie — jede Änderung wird nachvollziehbar protokolliert

### 🗓️ Jour Fixe (Kernfeature)
Der wöchentliche 1:1-Termin als geführter Workflow:
1. **Vorbereiten:** Unter der Woche Gesprächsthemen sammeln
2. **Durchführen:** Zwei-Spalten-Ansicht mit allen Projekten, offenen Punkten und Agenda — Änderungen werden lokal gesammelt
3. **Abschließen:** Alles wird atomar in einer Transaktion gespeichert, inkl. Stimmungs-Tracking
4. **Protokoll:** Druckoptimiertes Gesprächsprotokoll auf Knopfdruck
- Auto-Save als Entwurf, Rückblick seit dem letzten Termin, vollständige Historie

### 📊 Dashboard
- **Aufmerksamkeits-Radar:** Scoring zeigt, welche Mitarbeiter gerade Aufmerksamkeit brauchen (überfällige Vereinbarungen, lange kein Jour Fixe, Stimmungstrend)
- JF-Disziplin und offene Punkte auf einen Blick

### 🤖 KI auf Wunsch — nicht als Pflicht
Unisono funktioniert komplett ohne KI. Wer möchte, bindet ein LLM an:

| Option | Datenschutz |
|---|---|
| **Keine KI** | Keine Daten verlassen den Rechner |
| **Ollama (lokal)** | LLM läuft auf dem eigenen Rechner |
| **Cloud-API** (Gemini, OpenAI, Anthropic) | Eigener API-Key (BYOK), expliziter Consent-Dialog vor dem ersten Versand |

Features: kontextbewusster Chat-Assistent + automatisches Jour-Fixe-Briefing. API-Keys werden lokal gespeichert und in UI und Fehlermeldungen maskiert.

## Screenshots

*(folgen)*

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Desktop Shell | **Tauri v2** (Rust + System-WebView, ~35 MB Installer) |
| Backend | **Python FastAPI** + SQLite — als PyInstaller-Sidecar gebündelt |
| Frontend | **React 19** + TypeScript + Tailwind CSS v4 |
| State | TanStack React Query |

Der Endanwender braucht **weder Python noch Node.js** — alles steckt im Installer.

## Architektur-Highlights

```
Tauri (Rust)
 ├─ startet das Python-Backend als Sidecar-Prozess (dynamischer Port)
 ├─ wartet auf Health-Check und injiziert den Port ins Frontend
 └─ Graceful Shutdown über STDIN-Signal

FastAPI (Python)         React (TypeScript)
 ├─ SQLite, 20 Tabellen   ├─ React Query als Server-State
 ├─ Auth-Middleware       ├─ Changeset-Pattern im Jour Fixe
 └─ Rate-Limiting Login   └─ Druckoptimierte Protokoll-Ansicht
```

- **Changeset-Pattern:** Im Jour Fixe wird alles lokal editiert und beim Abschluss als ein Changeset atomar in einer DB-Transaktion angewendet — keine halbfertigen Zustände
- **Dev/Prod-Split:** Im Dev-Modus läuft Python live mit Hot-Reload (kein Sidecar-Rebuild nötig), in Production als gebündelte `.exe`
- **Auth:** Passwortschutz mit Session-Token, Rate-Limiting (5 Versuche → 15 Min Lockout), auth-geschützte Foto-Auslieferung

## Entwicklung

```bash
# Voraussetzungen: Python 3.11+, Node.js 24+, Rust, Tauri CLI

npm install
npm run dev        # startet Backend (live), Vite und das Tauri-Fenster

# Production-Build (Installer)
npm run build:all  # PyInstaller-Sidecar + cargo tauri build
```

## Lizenz

Alle Rechte vorbehalten. Dieses Repository dient als Portfolio-Referenz.
