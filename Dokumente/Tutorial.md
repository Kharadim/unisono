# Unisono — Anleitung & Tutorial

> Alles was du brauchst, um dein Team strukturiert zu fuehren.
> Ohne KI. Mit KI, wenn du willst. Lokal, wenn du musst.

---

## Inhaltsverzeichnis

1. [Erste Schritte](#1-erste-schritte)
2. [Das Dashboard](#2-das-dashboard)
3. [Mitarbeiter verwalten](#3-mitarbeiter-verwalten)
4. [Projekte verwalten](#4-projekte-verwalten)
5. [Unter der Woche arbeiten](#5-unter-der-woche-arbeiten)
6. [Jour Fixe — das Herzstueck](#6-jour-fixe--das-herzstueck)
7. [Entwicklungsplanung (STEPs)](#7-entwicklungsplanung-steps)
8. [KI-Assistent](#8-ki-assistent)
9. [Einstellungen](#9-einstellungen)
10. [Tipps & Best Practices](#10-tipps--best-practices)

---

## 1. Erste Schritte

### App starten

Unisono ist eine Desktop-App — einfach den Installer ausfuehren, fertig. Keine Cloud, kein Konto, keine Abhaengigkeiten. Deine Daten bleiben auf deinem Rechner.

### Passwort vergeben

Beim allerersten Start wirst du gebeten, ein Passwort zu setzen (mind. 4 Zeichen). Dieses Passwort schuetzt den Zugang zur App. Merke es dir gut — es gibt keine "Passwort vergessen"-Funktion.

Bei jedem weiteren Start meldest du dich mit diesem Passwort an. Nach 5 Fehlversuchen wird der Login fuer 15 Minuten gesperrt.

### Deinen Namen eingeben

Nach dem ersten Login fragt die App "Wie heisst du?". Dein Name erscheint im Begruessungsbildschirm. Du kannst ihn spaeter ueber die Sidebar jederzeit aendern.

### Begruessungsbildschirm

Bei jedem Start begruest dich Unisono mit einem personalisierten Splash-Screen — je nach Tageszeit mit "Guten Morgen", "Guten Tag" oder "Guten Abend" plus einem Fuehrungs-Zitat. Ein Klick bringt dich zum Dashboard.

### Demo-Daten oder Neustart?

Beim ersten Mal mit leerer Datenbank erscheint ein Willkommens-Dialog mit drei Branchen-Vorlagen:

| Vorlage | Inhalt |
|---------|--------|
| **Online Marketing** | 3 Mitarbeiter, 4 Projekte (SEO, Content, Paid Ads) |
| **Elektro-Handwerk** | 3 Mitarbeiter, 4 Projekte (Baustellen, Werkstatt) |
| **Steuerkanzlei** | 3 Mitarbeiter, 4 Projekte (Mandanten, Abschluesse) |

Die Demo-Daten helfen dir, Unisono kennenzulernen — mit realistischen Beispielen, fertigen Jour-Fixe-Sitzungen und absichtlich ueberfaelligen Punkten (damit du siehst, wie Warnungen aussehen). Du kannst sie spaeter mit einem Klick wieder entfernen.

Alternativ: "Ohne Beispieldaten starten" — du beginnst mit einer leeren App und legst alles selbst an.

### Onboarding-Tour

Nach dem Laden der Demo-Daten startet automatisch eine gefuehrte Tour mit Tooltips, die dir die wichtigsten Bereiche zeigt. Die Tour laeuft auf drei Seiten:
- **Dashboard:** Team-Uebersicht, Projekte, Statistiken, Radar
- **Mitarbeiter-Seite:** Tabs, JF-Button, Agenda
- **Jour Fixe:** Zwei-Spalten-Layout, Sidebar, Abschliessen

Du kannst die Tour jederzeit ueber die Sidebar neu starten ("Tour starten").

---

## 2. Das Dashboard

Das Dashboard ist deine Schaltzentrale — ein Blick und du weisst, wo es brennt.

### Statistik-Karten (oben)

Fuenf Karten zeigen dir auf einen Blick:

| Karte | Was sie zeigt |
|-------|---------------|
| **Mitarbeiter** | Gesamtzahl deines Teams |
| **Aktive Projekte** | Laufende Projekte (nicht abgeschlossen) |
| **Milestones erledigt** | z.B. "12/18" — wie viele Meilensteine insgesamt geschafft sind |
| **Overdue** | Ueberfaellige Milestones (rot wenn > 0) |
| **Vereinb. ueberfaellig** | Ueberfaellige Vereinbarungen — Hover zeigt dir welche genau |

### Mein Team

Dein Team als Karten-Uebersicht. Jede Karte zeigt Avatar, Name und Rolle. Besondere Hinweise:
- **Geburtstag** in den naechsten 14 Tagen (rosa Badge: "Heute!", "Morgen", "In 5d")
- **Firmenjubilaeum** in den naechsten 30 Tagen (blaues Badge mit Jahren)
- **JF ueberfaellig** — rotes Badge wenn >28 Tage, gelbes wenn >14 Tage seit dem letzten Jour Fixe

### Aufmerksamkeits-Radar

Das Radar ist dein Fruehwarnsystem. Es bewertet automatisch, welche Mitarbeiter gerade besondere Aufmerksamkeit brauchen. Je hoeher der Score, desto dringender.

**Wie wird der Score berechnet?**

| Signal | Punkte |
|--------|--------|
| Noch nie ein Jour Fixe gefuehrt | +5 |
| Kein JF seit ueber 28 Tagen | +4 |
| Kein JF seit ueber 14 Tagen | +2 |
| Schlechte Stimmung (Mood 1-2) | +3 |
| Stimmung sinkt seit 3 JFs | +2 |
| Pro ueberfaelliger Vereinbarung | +2 |
| Pro ueberfaelligem Milestone | +1 |
| Kein Entwicklungsplan vorhanden | +1 |
| STEPs-Gespraech offen | +1 |
| Pro ueberfaelliger Massnahme | +1 |

Jeder Eintrag zeigt den Mitarbeiter mit den konkreten Gruenden als farbige Badges. Das Radar erscheint nur, wenn es etwas zu zeigen gibt.

### Projekte nach Abteilung

Alle Projekte gruppiert nach Abteilungen deiner Mitarbeiter. Jede Abteilung zeigt:
- Aktive Projekte mit Status, Fortschrittsbalken und Teamfotos
- Ueberfaellige Milestones als Warndreiecke
- Abgeschlossene Projekte (eingeklappt, dezent dargestellt)

---

## 3. Mitarbeiter verwalten

### Neuen Mitarbeiter anlegen

Klicke auf das **+** neben "TEAM" in der Sidebar. Gib Name und optional Rolle ein — fertig. Den Rest kannst du auf der Mitarbeiter-Seite ergaenzen.

### Mitarbeiter-Seite: Profil

Oben siehst du das Profil deines Mitarbeiters:
- **Foto:** Hover ueber den Avatar → Upload-Button. Unterstuetzt JPG, PNG, WebP.
- **Stammdaten:** Name, Rolle, Abteilung, Startdatum, Geburtstag
- **Verantwortlichkeiten:** Freitext fuer den Aufgabenbereich
- **Persoenliches:** Einklappbarer Bereich fuer private Notizen (Hobbys, Familie etc. — nur fuer dich sichtbar)

Klicke auf den Stift zum Bearbeiten, Muelleimer zum Loeschen.

### Die vier Tabs

Die Mitarbeiter-Seite hat vier Tabs, die verschiedene Aspekte abdecken:

#### Tab 1: Uebersicht — "Was steht an?"

Dieser Tab zeigt dir den operativen Alltag:

**Projekte:** Zeigt alle Projekte, an denen der Mitarbeiter beteiligt ist. Ueber "Projekt" kannst du direkt ein neues Projekt anlegen — der Mitarbeiter wird automatisch als Mitglied hinzugefuegt.

**Offene Punkte:** Dein zentrales Aufgaben-Panel. Hier siehst du:
- **Vereinbarungen:** Alles was du mit dem Mitarbeiter vereinbart hast (mit optionalem Faelligkeitsdatum und Projektzuordnung). Klicke den Kreis zum Abhaken, den Stift zum Bearbeiten.
- **Entwicklungsmassnahmen:** Offene Massnahmen aus dem neuesten Entwicklungsplan erscheinen hier automatisch — so hast du operative und strategische Aufgaben an einem Ort.

Ueberfaellige Punkte werden rot hervorgehoben. Die Badge oben zeigt dir sofort, wie viele offen und wie viele ueberfaellig sind.

**JF-Vorbereitung (Agenda):** Sammle unter der Woche Themen fuer das naechste Jour Fixe. Du kannst jedem Thema optional ein Projekt zuordnen. Diese Themen tauchen dann in der JF-Sitzung als Checkliste auf.

#### Tab 2: Entwicklung — "Wohin entwickelt sich der Mitarbeiter?"

Hier findest du den Entwicklungsplan (STEPs) und die Zielvereinbarungen. Ausfuehrlich erklaert in [Kapitel 7](#7-entwicklungsplanung-steps).

#### Tab 3: Notizen — "Was wurde besprochen?"

Dein Notiz-Archiv fuer diesen Mitarbeiter:
- **Neue Notiz:** Schreibe Freitext + vergib optional Tags (z.B. "Feedback", "Lob", "Vereinbarung")
- **Monatsgruppierung:** Notizen werden nach Monat gruppiert. Der aktuelle Monat ist aufgeklappt, aeltere eingeklappt.
- **JF-Notizen:** Notizen aus Jour-Fixe-Sitzungen werden automatisch hier angezeigt (mit blauem Rand und "Jour Fixe"-Badge)
- **Filter:** Filtere Notizen nach Tags, um z.B. nur Feedback-Notizen zu sehen

#### Tab 4: Historie — "Wie hat sich die Stimmung entwickelt?"

Die JF-Historie zeigt:
- **Stimmungsverlauf:** Die letzten 12 Jour-Fixe-Stimmungen als Emoji-Reihe
- **Sitzungsliste:** Jede vergangene Sitzung mit Datum, Stimmung, allgemeinen Notizen und Projekt-Notizen. Ueber "Protokoll" kannst du das druckfertige Protokoll oeffnen.

---

## 4. Projekte verwalten

### Neues Projekt anlegen

Es gibt zwei Wege:
1. **Ueber die Mitarbeiter-Seite** (Tab Uebersicht → "Projekt"): Das Projekt wird erstellt und der Mitarbeiter automatisch hinzugefuegt.
2. **Jedes bestehende Projekt** kann ueber die Team-Sektion weitere Mitglieder bekommen.

### Projekt-Seite: Aufbau

Die Projektseite gliedert sich in einen Hauptbereich (links) und eine Seitenleiste (rechts).

**Header:** Projektname, Status-Badge (Aktiv/Pausiert/Abgeschlossen), optionale Statuszeile und Beschreibung. Klicke den Stift zum Bearbeiten.

#### Milestones — "Wo stehen wir?"

Meilensteine sind die Etappen deines Projekts. Jeder Milestone hat:
- **Status:** Klicke das Icon zum Durchschalten (Offen → In Arbeit → Erledigt)
- **Name & Faelligkeitsdatum:** Inline bearbeitbar (Stift-Icon beim Hovern)
- **Reihenfolge:** Mit Pfeilen nach oben/unten verschieben
- **Ueberfaellig:** Rot hervorgehoben wenn das Datum ueberschritten und nicht erledigt ist

Der Header zeigt "12/18" — du siehst sofort den Fortschritt.

#### KPIs — "Wie messen wir Erfolg?"

Key Performance Indicators mit Label, Wert und Einheit:
- Werte sind inline bearbeitbar (Stift-Icon)
- Jede Aenderung wird in der **KPI-Historie** protokolliert (Uhr-Icon)
- Die Historie zeigt: alter Wert → neuer Wert mit Zeitstempel
- KPIs koennen neu geordnet werden (Pfeile)

#### JF-Notizen — "Was wurde im JF besprochen?"

Zeigt die letzten Gespraechsnotizen aus Jour-Fixe-Sitzungen, die sich auf dieses Projekt beziehen. Inklusive Datum, Mitarbeitername und Tags.

#### Vereinbarungen — "Was wurde vereinbart?"

Vereinbarungen, die diesem Projekt zugeordnet sind. Du kannst:
- Status toggeln (Kreis klicken: offen ↔ erledigt)
- Inhalt und Datum inline bearbeiten (Stift-Icon)
- Erledigte Vereinbarungen ein-/ausblenden

#### Team (Seitenleiste)

Wer arbeitet am Projekt? Hier kannst du:
- Neue Mitglieder hinzufuegen (aus der Mitarbeiterliste)
- Projektrollen vergeben (Klick auf die Rolle → inline bearbeiten)
- Mitglieder entfernen

#### Verlauf (Seitenleiste)

Automatisches Aenderungsprotokoll: Wann wurde der Projektstatus, die Statuszeile oder andere Felder geaendert? Die letzten 3 Eintraege werden angezeigt, mit Link zur vollstaendigen History-Seite.

---

## 5. Unter der Woche arbeiten

Unisono ist nicht nur fuer Jour Fixes — du kannst jederzeit Daten pflegen. Alle Aenderungen zwischen zwei JFs werden im naechsten JF-Rueckblick angezeigt.

### Was kann ich wo bearbeiten?

| Was | Wo | Wie |
|-----|-----|-----|
| Vereinbarung erstellen | Mitarbeiter → Uebersicht → "Vereinbarung" | Formular mit Text, Datum, Projekt |
| Vereinbarung abhaken | Mitarbeiter → Uebersicht ODER Projektseite | Kreis klicken |
| Vereinbarung bearbeiten | Mitarbeiter → Uebersicht ODER Projektseite | Stift-Icon beim Hovern |
| Milestone Status aendern | Projektseite | Status-Icon klicken |
| Milestone bearbeiten | Projektseite | Stift-Icon beim Hovern |
| KPI-Wert aktualisieren | Projektseite | Stift-Icon beim Hovern |
| Entwicklungsmassnahme bearbeiten | Mitarbeiter → Uebersicht (Offene Punkte) | Stift-Icon beim Hovern |
| Notiz schreiben | Mitarbeiter → Notizen-Tab | Neues Notizfeld |
| JF-Agenda fuellen | Mitarbeiter → Uebersicht → JF-Vorbereitung | Thema eingeben + Enter |

### Aenderungs-Tracking

Wenn du zwischen zwei Jour Fixes Milestones, Vereinbarungen oder Entwicklungsmassnahmen bearbeitest (Name, Inhalt oder Datum aenderst), merkt sich Unisono das. Im naechsten JF siehst du im Rueckblick:
- Bearbeitete Milestones (mit Projektname)
- Bearbeitete Vereinbarungen (mit Projektname)
- Bearbeitete Massnahmen (mit Entwicklungsfeld)

**Wichtig:** Nur inhaltliche Aenderungen werden getrackt. Ein reines Status-Toggle (z.B. Milestone abhaken) zaehlt nicht als Bearbeitung — dafuer gibt es separate Eintraege im Rueckblick ("Erledigte Milestones").

---

## 6. Jour Fixe — das Herzstueck

Das Jour Fixe ist der Kern von Unisono. Es strukturiert dein Einzelgespraech und protokolliert alles automatisch.

### Vor dem Gespraech

1. **Themen sammeln:** Unter der Woche auf der Mitarbeiter-Seite (Uebersicht → JF-Vorbereitung) Punkte eintragen. Optional mit Projektzuordnung.
2. **KI-Briefing (optional):** Wenn KI aktiviert ist, klicke "JF vorbereiten" — die KI fasst die aktuelle Situation zusammen und schlaegt Gespraechspunkte vor.

### Session starten

Klicke "Jour Fixe" auf der Mitarbeiter-Seite. Falls noch eine alte, nicht abgeschlossene Session existiert, wirst du gefragt: Fortsetzen, verwerfen oder neu starten?

### Waehrend des Gespraechs

Das JF hat ein Zwei-Spalten-Layout:

**Links: Projekt-Akkordeon**

Jedes aktive Projekt ist ein aufklappbares Panel mit:
- **Status:** Dropdown (Aktiv/Pausiert/Abgeschlossen) + Statuszeile (Freitext)
- **Milestones:** Status toggeln, neue anlegen, Name/Datum bearbeiten
- **KPIs:** Werte direkt aktualisieren, neue anlegen
- **Neue Vereinbarungen:** Direkt im Projektkontext erstellen
- **Gespraechsnotizen:** Freitext + Tags fuer das Protokoll

Geaenderte Projekte bekommen einen blauen Rand — du siehst sofort, wo du etwas angepasst hast.

**Rechts: Seitenleiste (zwei Tabs)**

*Tab "Gespraech":*
- **Vorbereitete Themen:** Deine Agenda-Punkte als Checkliste. Abgehakte werden nach dem JF automatisch entfernt.
- **Offene Punkte:** Alle offenen Vereinbarungen + Entwicklungsmassnahmen auf einen Blick. Direkt abhaken wenn besprochen.
- **Allgemeine Notizen:** Projektuebergreifende Gespraechsnotizen + Tags

*Tab "Entwicklung":*
- Zielvereinbarungen mit Status-Toggle
- Entwicklungsmassnahmen und Weiterbildungen mit Status-Toggle

**Oben: Stimmung & Kontrolle**
- **Stimmungs-Auswahl:** 5 Emojis von schlecht bis gut
- **Aenderungs-Zaehler:** Badge zeigt dir, wie viele Aenderungen gesammelt wurden
- **Auto-Save:** Dein Entwurf wird alle 2 Sekunden lokal gesichert. Bei einem Browser-Crash geht nichts verloren.

### Gespraechsleitfaden

Ein einklappbarer Leitfaden mit vier Phasen hilft dir bei der Struktur:

| Phase | Dauer | Beispielfragen |
|-------|-------|----------------|
| **Check-in** | ~2 Min | "Wie wuerdest du deine aktuelle Arbeitslast beschreiben?" |
| **Rueckblick** | ~5 Min | "Worauf bist du seit unserem letzten Gespraech besonders stolz?" |
| **Themen** | ~15 Min | "Wo brauchst du eine Entscheidung oder Freigabe von mir?" |
| **Ausblick** | ~3 Min | "Was ist dein wichtigstes Ziel fuer die naechste Woche?" |

### Rueckblick seit letztem JF

Automatisch generiert — zeigt was seit dem letzten JF passiert ist:
- Erledigte Vereinbarungen
- Erledigte Milestones
- KPI-Aenderungen
- Bearbeitete Milestones, Vereinbarungen und Massnahmen

### Abschliessen

Klicke "Abschliessen" — eine Zusammenfassung zeigt alle Aenderungen. Nach Bestaetigung wird alles **in einer Transaktion** gespeichert:
- Milestone-Status und KPI-Werte werden aktualisiert
- Neue Milestones, KPIs und Vereinbarungen werden erstellt
- Ziel-, Massnahmen- und Weiterbildungs-Status werden aktualisiert
- Notizen werden gespeichert (allgemein + pro Projekt)
- Abgehakte Agenda-Punkte werden als besprochen markiert
- Stimmung wird protokolliert

Danach erscheint ein Erfolgsbildschirm mit zwei Optionen:
- **Protokoll anzeigen** — druckfertiges JF-Protokoll
- **Zurueck zum Mitarbeiter**

### Protokoll

Das Protokoll ist eine print-optimierte Seite mit allen JF-Ergebnissen:
- Allgemeine Notizen, Projekt-Notizen (mit Tags), neue Vereinbarungen
- Aktuelle Ziele, Entwicklungsfelder mit Massnahmen, Weiterbildungen
- STEPs-Zusammenfassung (Leistung, Talent Pool)

Ueber "Drucken / PDF" kannst du es direkt drucken oder als PDF speichern.

### Sicherheitsnetz

- **Auto-Save:** Entwurf wird alle 2 Sekunden im Browser gespeichert
- **Crash-Recovery:** Nach einem Absturz wird der Entwurf automatisch wiederhergestellt
- **Navigationsschutz:** Beim Verlassen der Seite mit ungesicherten Aenderungen wirst du gewarnt

---

## 7. Entwicklungsplanung (STEPs)

Der Entwicklungsplan basiert auf dem STEPs-Framework und dient der strategischen Mitarbeiterentwicklung. Du findest ihn unter Mitarbeiter → Tab "Entwicklung".

### Plan anlegen

Klicke "Neuer Plan" und gib eine Periode an (z.B. "2026"). Du kannst pro Mitarbeiter mehrere Plaene haben — z.B. einen pro Jahr. Der neueste ist aufgeklappt, aeltere werden kompakt dargestellt.

### Reflexion

Vier Textfelder fuer die gemeinsame Reflexion:
- **Aufgabenschwerpunkte:** Was waren die Hauptaufgaben?
- **Erfolge:** Was lief gut?
- **Herausforderungen:** Was war schwierig?
- **Fokusthemen naechstes Jahr:** Wohin soll die Reise gehen?

Aenderungen werden erst beim Klick auf "Speichern" uebernommen.

### Staerken

Eine Liste der Staerken des Mitarbeiters. Frei formuliert, inline bearbeitbar. Diese Staerken helfen dir, den Mitarbeiter gezielt einzusetzen.

### Entwicklungsfelder

Hier wird es konkret. Jedes Entwicklungsfeld hat:
- **Titel:** z.B. "Praesentation & Kommunikation"
- **Prioritaet:** Hoch, Mittel oder Niedrig
- **Beschreibung:** Optionale Erlaeuterung
- **Massnahmen:** Konkrete Schritte zur Entwicklung

Massnahmen haben einen Dreier-Status-Zyklus: **Offen → In Arbeit → Erledigt**. Ueberfaellige Massnahmen werden rot markiert.

**Wichtig:** Offene Massnahmen aus dem neuesten Plan erscheinen automatisch auf dem Uebersicht-Tab unter "Offene Punkte" — direkt neben den Vereinbarungen. So hast du operative und strategische Aufgaben an einem Ort.

### Leistung & Potenzial (STEPs-Bewertung)

Strukturierte Einschaetzung in vier Bereichen:

| Bereich | Optionen |
|---------|----------|
| **Leistungseinschaetzung** | Uebertroffen / Voll erfuellt / Teilweise erfuellt / Unzureichend |
| **Veraenderungsinteresse** | A: Verbleib in aktueller Rolle / B: Veraenderungsinteresse (mit Freitext) |
| **Talent Pool** | Kein Wert / Horizontal / Vertikal |
| **Mobilitaet** | Ja/Nein, bei Ja: Regional/National/International + Standorte |

### Weiterbildungen

Trainings und Schulungen mit eigenem Status-Zyklus: **Vorgeschlagen → Genehmigt → Abgeschlossen**. Jede Weiterbildung kann Anbieter, Kosten und Faelligkeitsdatum haben.

### Anmerkungen

Ein allgemeines Freitextfeld fuer Bemerkungen zum Plan.

---

## 8. KI-Assistent

Die KI-Features sind optional — Unisono funktioniert vollstaendig ohne. Wenn du sie nutzen willst, hast du vier Provider zur Wahl.

### Einrichten

Oeffne die KI-Einstellungen ueber "KI-Assistent" in der Sidebar. Waehle deinen Provider:

| Provider | Wo laeuft die KI? | Kosten | Datenverarbeitung |
|----------|-------------------|--------|-------------------|
| **Ollama (lokal)** | Auf deinem Rechner | Kostenlos | Daten bleiben lokal |
| **Google Gemini** | Google Cloud | API-Kosten | Daten werden gesendet |
| **OpenAI** | OpenAI Server | API-Kosten | Daten werden gesendet |
| **Anthropic (Claude)** | Anthropic Server | API-Kosten | Daten werden gesendet |

**Fuer maximalen Datenschutz:** Waehle Ollama. Die KI laeuft komplett auf deinem Rechner, nichts verlasst das Geraet. Empfohlene Modelle: qwen2.5:7b (4.7 GB) oder gemma3 (8 GB).

**Fuer beste Qualitaet:** Waehle einen Cloud-Provider. Du benoetigst einen eigenen API-Key (BYOK = Bring Your Own Key). Beim ersten Senden erscheint eine Datenschutz-Warnung, die erklaert welche Mitarbeiterdaten uebermittelt werden.

### Chat-Widget

Wenn KI aktiviert ist, erscheint rechts unten ein Chat-Button. Der KI-Assistent kennt den Kontext der aktuellen Seite:
- Auf der **Mitarbeiter-Seite**: kennt er den Mitarbeiter, seine Projekte, Vereinbarungen, Stimmung, Entwicklungsplan
- Auf dem **Dashboard**: kennt er die Team-Uebersicht
- Im **Jour Fixe**: kennt er den Mitarbeiter und die aktuelle Session

Beispielfragen:
- "Wie wuerde ich ein kritisches Feedback-Gespraech mit Lisa fuehren?"
- "Welche Entwicklungsfelder wuerden zu Toms Rolle passen?"
- "Fasse die aktuelle Projektsituation zusammen."

### JF-Briefing

Auf der Mitarbeiter-Seite erscheint ein "JF vorbereiten"-Button (Sparkles-Icon). Die KI analysiert:
- Letzte JF-Sitzungen und deren Ergebnisse
- Offene Vereinbarungen und Massnahmen
- Ziele und Entwicklungsplan
- Stimmungsverlauf

Und liefert dir einen strukturierten Vorbereitungstext mit Gespraechsempfehlungen.

---

## 9. Einstellungen

### Tags verwalten

Tags helfen dir, Notizen zu kategorisieren. Oeffne "Tags verwalten" in der Sidebar.

- 7 Standard-Tags sind vorkonfiguriert (z.B. Feedback, Lob, Vereinbarung)
- Erstelle eigene Tags mit Name und Farbe
- Aendere Reihenfolge, Namen und Farben
- Loeschen eines Tags entfernt ihn auch aus allen bestehenden Notizen

Tags kannst du auf **Gespraechsnotizen** im JF und auf **allgemeine Notizen** setzen. Auf dem Notizen-Tab kannst du nach Tags filtern.

### Passwort aendern

Ueber die Sidebar: Altes Passwort eingeben, neues setzen. Ein neuer Session-Token wird automatisch generiert.

### Name aendern

Der angezeigte Name auf dem Splash-Screen. Klicke auf das Stift-Icon neben deinem Namen in der Sidebar.

### Datenschutz

Eine Info-Seite, die erklaert wie Unisono mit deinen Daten umgeht. Erreichbar ueber das Schild-Icon in der Sidebar.

---

## 10. Tipps & Best Practices

### Woechentlicher Rhythmus

Ein bewaehrter Arbeitsablauf:

| Wann | Was tun | Wo in Unisono |
|------|---------|---------------|
| **Montag** | Dashboard checken: Wer braucht Aufmerksamkeit? Welche Termine stehen an? | Dashboard → Radar |
| **Unter der Woche** | Themen fuer JFs sammeln, sobald sie aufkommen | Mitarbeiter → Uebersicht → JF-Vorbereitung |
| **Vor dem JF** | KI-Briefing lesen (optional), offene Punkte pruefen | Mitarbeiter → "JF vorbereiten" |
| **Im JF** | Jour Fixe durchfuehren, alles direkt in Unisono erfassen | Jour Fixe Seite |
| **Nach dem JF** | Protokoll drucken/speichern, neue Vereinbarungen pruefen | Protokoll-Seite |
| **Laufend** | KPI-Werte aktualisieren, Milestones abhaken, Notizen machen | Projektseite, Mitarbeiter-Seite |

### Vereinbarungen effektiv nutzen

- **Immer ein Datum setzen:** Vereinbarungen ohne Datum koennen nicht ueberfaellig werden — und gehen unter.
- **Projekt zuordnen:** So siehst du die Vereinbarung sowohl auf der Mitarbeiter- als auch auf der Projektseite.
- **Im JF abhaken:** Offene Vereinbarungen erscheinen automatisch in der JF-Seitenleiste. Hake sie dort ab wenn sie erledigt sind.

### Stimmungs-Tracking nutzen

Die 5 Emojis im JF sind mehr als Deko:
- Der **Stimmungsverlauf** auf dem Historie-Tab zeigt dir Trends ueber Monate
- Das **Aufmerksamkeits-Radar** reagiert auf schlechte oder sinkende Stimmung
- Nach mehreren JFs erkennst du Muster (z.B. Stimmungsabfall nach Projektphasen)

### Entwicklungsplan als Fuehrungsinstrument

- **Ein Plan pro Jahr** als Gespraechsgrundlage fuer Halbjahres-/Jahresgespraeche
- **Massnahmen konkret formulieren:** "React-Kurs bis Q2" statt "Weiterentwicklung Frontend"
- **Offene Massnahmen** erscheinen automatisch in den "Offenen Punkten" — so gehen sie nicht unter
- **Im JF besprechen:** Der Entwicklungs-Tab in der JF-Seitenleiste zeigt Massnahmen und Weiterbildungen zum Durchsprechen

### Suche nutzen

Das Suchfeld in der Sidebar filtert gleichzeitig Mitarbeiter und Projekte. Tippe einen Teil des Namens ein, um schnell zu navigieren.

### Demo-Daten zum Lernen

Lade die Demo-Daten, experimentiere frei, und entferne sie wieder wenn du bereit bist, mit echten Daten zu arbeiten. Die Demo-Daten zeigen realistische Szenarien mit absichtlichen "Problemfaellen" (ueberfaellige Punkte, schlechte Stimmung), damit du alle Features kennenlernst.

---

## Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **Jour Fixe (JF)** | Regelmaessiges Einzelgespraech zwischen Teamlead und Mitarbeiter |
| **Changeset** | Alle Aenderungen aus einem JF werden gebuendelt und in einem Schritt gespeichert |
| **Milestone** | Meilenstein eines Projekts mit Status und optionalem Faelligkeitsdatum |
| **KPI** | Kennzahl (Key Performance Indicator) eines Projekts |
| **Vereinbarung** | Absprache mit einem Mitarbeiter, optional einem Projekt zugeordnet |
| **Entwicklungsfeld** | Bereich in dem sich ein Mitarbeiter weiterentwickeln soll |
| **Massnahme** | Konkreter Schritt innerhalb eines Entwicklungsfeldes |
| **STEPs** | Framework fuer den strukturierten Entwicklungsplan |
| **Stimmung / Mood** | 5-stufige Stimmungseinschaetzung im JF (1 = schlecht, 5 = gut) |
| **Aufmerksamkeits-Radar** | Automatische Scoring-Logik die zeigt, welche MA Aufmerksamkeit brauchen |
| **Tag** | Farbige Markierung auf Notizen zur Kategorisierung |
| **Onboarding-Tour** | Gefuehrte Tooltips die die wichtigsten Bereiche erklaeren |
| **Sidecar** | Technisch: Das Python-Backend laeuft als eigenstaendiger Prozess neben der App |
