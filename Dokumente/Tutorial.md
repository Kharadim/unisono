# Unisono — Anleitung & Tutorial

> Alles was du brauchst, um dein Team strukturiert zu fuehren.
> Ohne KI. Mit KI, wenn du willst. Lokal, wenn du musst.

---

## Inhaltsverzeichnis

0. [Schnellstart: Deine ersten 10 Minuten](#0-schnellstart-deine-ersten-10-minuten)
1. [Erste Schritte](#1-erste-schritte)
2. [Das Dashboard](#2-das-dashboard)
3. [Mitarbeiter verwalten](#3-mitarbeiter-verwalten)
4. [Projekte verwalten](#4-projekte-verwalten)
5. [Unter der Woche arbeiten](#5-unter-der-woche-arbeiten)
6. [Jour Fixe — das Herzstueck](#6-jour-fixe--das-herzstueck)
7. [Entwicklung & Ziele](#7-entwicklung--ziele)
8. [KI-Assistent](#8-ki-assistent)
9. [Einstellungen](#9-einstellungen)
10. [Tipps & Best Practices](#10-tipps--best-practices)
11. [Loeschen & Konsequenzen](#11-loeschen--konsequenzen)

---

## 0. Schnellstart: Deine ersten 10 Minuten

Du willst sofort loslegen? Hier der kuerzeste Weg:

1. **App starten** → Passwort setzen → deinen Namen eingeben
2. **Demo-Daten laden** — waehle eine der drei Branchen-Vorlagen (z.B. "Online Marketing")
3. **Dashboard anschauen** — du siehst sofort dein Team, Projekte und das Aufmerksamkeits-Radar
4. **Einen Mitarbeiter anklicken** — erkunde die Tabs: Uebersicht, Entwicklung, Notizen, Historie
5. **Ein Projekt oeffnen** — sieh dir Milestones, KPIs und Vereinbarungen an
6. **Ein Jour Fixe starten** — klicke "Jour Fixe" auf der Mitarbeiter-Seite und probiere das Zwei-Spalten-Layout aus. Du kannst die Session jederzeit verwerfen, ohne dass etwas gespeichert wird.

Die Onboarding-Tour fuehrt dich automatisch durch die wichtigsten Bereiche. Wenn du tiefer einsteigen willst, lies die folgenden Kapitel.

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

> **Praxis-Beispiel:** Du oeffnest am Montagmorgen das Dashboard. Das Radar zeigt Lisa mit Score 8 (rot). Die Gruende: "Kein JF seit 32 Tagen", "2 ueberfaellige Vereinbarungen", "Stimmung sinkt". Du weisst sofort: Lisa braucht als naechstes ein Gespraech — und kannst auf ihren Namen klicken, um die Details zu sehen.

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

Klicke auf den Stift zum Bearbeiten, Muelleimer zum Loeschen (siehe [Loeschen & Konsequenzen](#11-loeschen--konsequenzen)).

### Die vier Tabs

Die Mitarbeiter-Seite hat vier Tabs, die verschiedene Aspekte abdecken:

#### Tab 1: Uebersicht — "Was steht an?"

Dieser Tab zeigt dir den operativen Alltag:

**Projekte:** Zeigt alle Projekte, an denen der Mitarbeiter beteiligt ist. Ueber "Projekt" kannst du direkt ein neues Projekt anlegen — der Mitarbeiter wird automatisch als Mitglied hinzugefuegt.

**Offene Punkte:** Dein zentrales Aufgaben-Panel. Hier laufen zwei Dinge zusammen:
- **Vereinbarungen:** Alles was du mit dem Mitarbeiter vereinbart hast (mit optionalem Faelligkeitsdatum und Projektzuordnung). Klicke den Kreis zum Abhaken, den Stift zum Bearbeiten.
- **Entwicklungsmassnahmen:** Offene Massnahmen aus dem neuesten Entwicklungsplan (siehe [Kapitel 7](#7-entwicklung--ziele)) erscheinen hier automatisch.

So hast du operative Aufgaben (Vereinbarungen) und strategische Aufgaben (Massnahmen) an einem Ort. Ueberfaellige Punkte werden rot hervorgehoben. Die Badge oben zeigt dir sofort, wie viele offen und wie viele ueberfaellig sind.

**JF-Vorbereitung (Agenda):** Sammle unter der Woche Themen fuer das naechste Jour Fixe. Du kannst jedem Thema optional ein Projekt zuordnen. Diese Themen tauchen dann in der JF-Sitzung als Checkliste auf (siehe [Kapitel 6](#6-jour-fixe--das-herzstueck)).

#### Tab 2: Entwicklung — "Wohin entwickelt sich der Mitarbeiter?"

Hier findest du den Entwicklungsplan (STEPs) und die Zielvereinbarungen. Ausfuehrlich erklaert in [Kapitel 7](#7-entwicklung--ziele).

#### Tab 3: Notizen — "Was wurde besprochen?"

Dein Notiz-Archiv fuer diesen Mitarbeiter:
- **Neue Notiz:** Schreibe Freitext + vergib optional Tags (z.B. "Feedback", "Lob", "Vereinbarung")
- **Monatsgruppierung:** Notizen werden nach Monat gruppiert. Der aktuelle Monat ist aufgeklappt, aeltere eingeklappt.
- **JF-Notizen:** Notizen aus Jour-Fixe-Sitzungen werden automatisch hier angezeigt (mit blauem Rand und "Jour Fixe"-Badge). Du musst sie nicht manuell uebertragen.
- **Filter:** Filtere Notizen nach Tags, um z.B. nur Feedback-Notizen zu sehen

#### Tab 4: Historie — "Wie hat sich die Stimmung entwickelt?"

Die JF-Historie zeigt:
- **Stimmungsverlauf:** Die letzten 12 Jour-Fixe-Stimmungen als Emoji-Reihe — du erkennst Trends auf einen Blick
- **Sitzungsliste:** Jede vergangene Sitzung mit Datum, Stimmung, allgemeinen Notizen und Projekt-Notizen. Ueber "Protokoll" kannst du das druckfertige Protokoll oeffnen.

---

## 4. Projekte verwalten

### Neues Projekt anlegen

Es gibt zwei Wege:
1. **Ueber die Mitarbeiter-Seite** (Tab Uebersicht → "Projekt"): Das Projekt wird erstellt und der Mitarbeiter automatisch als Mitglied hinzugefuegt.
2. **Jedes bestehende Projekt** kann ueber die Team-Sektion auf der Projektseite weitere Mitglieder bekommen.

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
- Jede Aenderung wird in der **KPI-Historie** protokolliert (Uhr-Icon) — du siehst: alter Wert → neuer Wert mit Zeitstempel
- KPIs koennen neu geordnet werden (Pfeile)

#### JF-Notizen — "Was wurde im JF besprochen?"

Zeigt die letzten Gespraechsnotizen aus Jour-Fixe-Sitzungen, die sich auf dieses Projekt beziehen. Inklusive Datum, Mitarbeitername und Tags. So siehst du auf der Projektseite was in den letzten Einzelgespraechen zu diesem Projekt besprochen wurde.

#### Vereinbarungen — "Was wurde vereinbart?"

Vereinbarungen, die diesem Projekt zugeordnet sind. Du kannst:
- Status toggeln (Kreis klicken: offen ↔ erledigt)
- Inhalt und Datum inline bearbeiten (Stift-Icon)
- Erledigte Vereinbarungen ein-/ausblenden

Diese Vereinbarungen erscheinen auch auf der Mitarbeiter-Seite unter "Offene Punkte" — es ist dieselbe Vereinbarung, sichtbar von beiden Seiten.

#### Team (Seitenleiste)

Wer arbeitet am Projekt? Hier kannst du:
- Neue Mitglieder hinzufuegen (aus der Mitarbeiterliste)
- Projektrollen vergeben (Klick auf die Rolle → inline bearbeiten)
- Mitglieder entfernen

#### Verlauf (Seitenleiste)

Automatisches Aenderungsprotokoll: Wann wurde der Projektstatus, die Statuszeile oder andere Felder geaendert? Die letzten 3 Eintraege werden angezeigt, mit Link zur vollstaendigen History-Seite.

---

## 5. Unter der Woche arbeiten

Unisono ist nicht nur fuer Jour Fixes — du kannst jederzeit Daten pflegen. Aenderungen an Milestones, Vereinbarungen und Entwicklungsmassnahmen werden automatisch getrackt und im naechsten JF-Rueckblick angezeigt.

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

### Szenario: Ein typischer Mittwoch

> Es ist Mittwoch. Du bekommst eine Mail: Der Launch-Termin fuer das SEO-Projekt verschiebt sich um zwei Wochen.
>
> 1. Du oeffnest das Projekt in der Sidebar
> 2. Beim Milestone "Go-Live" klickst du den Stift und aenderst das Datum
> 3. Du aktualisierst den KPI "Organic Sessions" mit dem neuesten Wert
> 4. Dir faellt ein, dass du mit Tom darueber sprechen solltest → du gehst auf Toms Mitarbeiter-Seite und traegst unter JF-Vorbereitung ein: "Launch-Verschiebung SEO besprechen"
> 5. Du erstellst eine neue Vereinbarung fuer Tom: "Neuen Zeitplan fuer Content-Rollout erstellen" mit Faelligkeitsdatum naechste Woche
>
> Wenn du am Freitag das Jour Fixe mit Tom startest, zeigt der Rueckblick automatisch: "Milestone 'Go-Live' bearbeitet (SEO-Projekt)". Dein vorbereitetes Thema erscheint als Checklisten-Punkt. Die neue Vereinbarung steht unter "Offene Punkte". Du hast nichts vergessen.

---

## 6. Jour Fixe — das Herzstueck

Das Jour Fixe ist der Kern von Unisono. Es strukturiert dein Einzelgespraech und protokolliert alles automatisch.

### Vor dem Gespraech

1. **Themen sammeln:** Unter der Woche auf der Mitarbeiter-Seite (Uebersicht → JF-Vorbereitung) Punkte eintragen. Optional mit Projektzuordnung.
2. **KI-Briefing (optional):** Wenn KI aktiviert ist, klicke "JF vorbereiten" — die KI fasst die aktuelle Situation zusammen und schlaegt Gespraechspunkte vor (siehe [Kapitel 8](#8-ki-assistent)).

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
- **Offene Punkte:** Alle offenen Vereinbarungen + Entwicklungsmassnahmen auf einen Blick. Direkt abhaken wenn erledigt.
- **Allgemeine Notizen:** Projektuebergreifende Gespraechsnotizen + Tags

*Tab "Entwicklung":*
- Zielvereinbarungen mit Status-Toggle
- Entwicklungsmassnahmen und Weiterbildungen mit Status-Toggle

**Oben: Stimmung & Kontrolle**
- **Stimmungs-Auswahl:** 5 Emojis von schlecht bis gut
- **Aenderungs-Zaehler:** Badge zeigt dir, wie viele Aenderungen gesammelt wurden
- **Auto-Save:** Dein Entwurf wird alle 2 Sekunden lokal gesichert. Bei einem Absturz geht nichts verloren — beim naechsten Oeffnen wird der Entwurf automatisch wiederhergestellt. Beim Verlassen der Seite mit ungesicherten Aenderungen wirst du gewarnt.

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
- Bearbeitete Milestones, Vereinbarungen und Massnahmen (siehe [Aenderungs-Tracking](#aenderungs-tracking))

### Abschliessen

Klicke "Abschliessen" — eine Zusammenfassung zeigt alle gesammelten Aenderungen. Nach Bestaetigung wird alles zuverlaessig auf einmal gespeichert:
- Milestone-Status und KPI-Werte werden aktualisiert
- Neue Milestones, KPIs und Vereinbarungen werden erstellt
- Ziel-, Massnahmen- und Weiterbildungs-Status werden aktualisiert
- Notizen werden gespeichert (allgemein + pro Projekt)
- Abgehakte Agenda-Punkte werden als besprochen markiert
- Stimmung wird protokolliert

Es kann nichts "halb gespeichert" werden — entweder alles oder nichts.

Danach erscheint ein Erfolgsbildschirm mit zwei Optionen:
- **Protokoll anzeigen** — druckfertiges JF-Protokoll
- **Zurueck zum Mitarbeiter**

### Protokoll

Das Protokoll ist eine druckfertige Seite mit allen JF-Ergebnissen:
- Allgemeine Notizen, Projekt-Notizen (mit Tags), neue Vereinbarungen
- Aktuelle Ziele, Entwicklungsfelder mit Massnahmen, Weiterbildungen
- STEPs-Zusammenfassung (Leistung, Talent Pool)

Ueber "Drucken / PDF" kannst du es direkt drucken oder als PDF speichern.

> **Szenario: Dein erstes Jour Fixe**
>
> Du hast unter der Woche drei Themen fuer Lisa vorbereitet. Jetzt sitzt ihr zusammen.
>
> 1. Du klickst "Jour Fixe" auf Lisas Seite → das Zwei-Spalten-Layout oeffnet sich
> 2. Rechts siehst du deine drei vorbereiteten Themen als Checkliste
> 3. Du klappst das erste Projekt auf, besprecht den Fortschritt, hakst einen Milestone ab
> 4. Du erstellst eine neue Vereinbarung: "Praesentation bis Freitag fertig"
> 5. Du setzt die Stimmung auf das mittlere Emoji — Lisa ist zufrieden, aber gestresst
> 6. Du klickst "Abschliessen", checkst die Zusammenfassung, speicherst
> 7. Du druckst das Protokoll und gibst Lisa eine Kopie
>
> Am naechsten Montag zeigt das Dashboard: Lisas letztes JF war vor 3 Tagen. Die Vereinbarung "Praesentation bis Freitag" steht in ihren offenen Punkten. Alles im Griff.

---

## 7. Entwicklung & Ziele

Dieses Kapitel deckt zwei zusammengehoerige Features ab: den **Entwicklungsplan (STEPs)** fuer die strategische Mitarbeiterentwicklung und die **Zielvereinbarungen** fuer konkrete, messbare Ziele. Beides findest du unter Mitarbeiter → Tab "Entwicklung".

### Entwicklungsplan (STEPs)

Der Entwicklungsplan basiert auf dem STEPs-Framework und dient als Gespraechsgrundlage fuer Halbjahres- oder Jahresgespraeche.

#### Plan anlegen

Klicke "Neuer Plan" und gib eine Periode an (z.B. "2026"). Du kannst pro Mitarbeiter mehrere Plaene haben — z.B. einen pro Jahr. Der neueste ist aufgeklappt, aeltere werden kompakt dargestellt (z.B. "3 Staerken, 2 Felder").

#### Reflexion

Vier Textfelder fuer die gemeinsame Reflexion:
- **Aufgabenschwerpunkte:** Was waren die Hauptaufgaben?
- **Erfolge:** Was lief gut?
- **Herausforderungen:** Was war schwierig?
- **Fokusthemen naechstes Jahr:** Wohin soll die Reise gehen?

Aenderungen werden erst beim Klick auf "Speichern" uebernommen.

#### Staerken

Eine Liste der Staerken des Mitarbeiters. Frei formuliert, inline bearbeitbar. Diese Staerken helfen dir, den Mitarbeiter gezielt einzusetzen.

#### Entwicklungsfelder

Hier wird es konkret. Jedes Entwicklungsfeld hat:
- **Titel:** z.B. "Praesentation & Kommunikation"
- **Prioritaet:** Hoch, Mittel oder Niedrig
- **Beschreibung:** Optionale Erlaeuterung
- **Massnahmen:** Konkrete Schritte zur Entwicklung

Massnahmen haben einen Dreier-Status-Zyklus: **Offen → In Arbeit → Erledigt**. Ueberfaellige Massnahmen werden rot markiert.

**Wichtig:** Offene Massnahmen aus dem neuesten Plan erscheinen automatisch auf dem Uebersicht-Tab unter "Offene Punkte" — direkt neben den Vereinbarungen. So gehen strategische Aufgaben im Tagesgeschaeft nicht unter.

#### Leistung & Potenzial (STEPs-Bewertung)

Strukturierte Einschaetzung in vier Bereichen:

| Bereich | Optionen |
|---------|----------|
| **Leistungseinschaetzung** | Uebertroffen / Voll erfuellt / Teilweise erfuellt / Unzureichend |
| **Veraenderungsinteresse** | A: Verbleib in aktueller Rolle / B: Veraenderungsinteresse (mit Freitext) |
| **Talent Pool** | Kein Wert / Horizontal / Vertikal |
| **Mobilitaet** | Ja/Nein, bei Ja: Regional/National/International + Standorte |

#### Weiterbildungen

Trainings und Schulungen mit eigenem Status-Zyklus: **Vorgeschlagen → Genehmigt → Abgeschlossen**. Jede Weiterbildung kann Anbieter, Kosten und Faelligkeitsdatum haben.

#### Anmerkungen

Ein allgemeines Freitextfeld fuer Bemerkungen zum Plan.

### Zielvereinbarungen

Zielvereinbarungen sind konkrete, messbare Ziele — unabhaengig vom Entwicklungsplan. Sie eignen sich fuer Quartalsziele, Jahresziele oder projektuebergreifende Vorgaben.

#### Ziel anlegen

Klicke "Ziel" und fuelle aus:
- **Titel:** z.B. "Zertifizierung Google Ads bis Q3"
- **Beschreibung:** Optionale Details
- **Kategorie:** Fachlich, Persoenlich oder Fuehrung
- **Faelligkeitsdatum**
- **Periode:** z.B. "2026" oder "Q1 2026" — Ziele werden nach Perioden gruppiert

#### Status-Zyklus

Ziele haben vier Zustaende:
- **Offen** → **In Arbeit** → **Erreicht** (Dreifach-Toggle durch Klick auf das Status-Icon)
- **Nicht erreicht** (separater Button) — fuer Ziele die bewusst als nicht geschafft markiert werden

#### Wo erscheinen Ziele?

- **Mitarbeiter → Entwicklung:** Vollstaendige Ansicht mit allen Details, gruppiert nach Periode
- **Jour Fixe → Sidebar (Tab "Entwicklung"):** Status-Toggle waehrend des Gespraeches
- **JF-Protokoll:** Aktuelle Ziele mit Status, Kategorie und Faelligkeit

#### Entwicklungsplan vs. Zielvereinbarungen — Was nutze ich wann?

| | Entwicklungsplan (STEPs) | Zielvereinbarungen |
|---|---|---|
| **Zweck** | Langfristige Mitarbeiterentwicklung | Konkrete, messbare Ziele |
| **Typischer Zeitraum** | 1 Jahr | Quartal bis Jahr |
| **Beispiel** | Entwicklungsfeld "Kommunikation" mit Massnahme "Praesentationstraining besuchen" | "Zertifizierung Google Ads bis Q3" |
| **Erscheint in Offene Punkte** | Ja (Massnahmen) | Nein |
| **Im JF besprechbar** | Ja (Tab "Entwicklung") | Ja (Tab "Entwicklung") |
| **Wann anlegen** | Jahresgespraech, Onboarding | Quartalsbeginn, nach Bedarf |

Du kannst beides parallel nutzen. Massnahmen aus dem Entwicklungsplan koennen sogar mit Zielen verknuepft werden.

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

**Fuer beste Qualitaet:** Waehle einen Cloud-Provider. Du benoetigst einen eigenen API-Schluessel von dem jeweiligen Anbieter. Beim ersten Senden erscheint eine Datenschutz-Warnung, die erklaert welche Mitarbeiterdaten uebermittelt werden. Du musst aktiv zustimmen, bevor Daten gesendet werden.

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

Auf der Mitarbeiter-Seite erscheint ein "JF vorbereiten"-Button. Die KI analysiert:
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

Tags kannst du auf **Gespraechsnotizen** im JF und auf **allgemeine Notizen** setzen. Auf dem Notizen-Tab kannst du nach Tags filtern — praktisch um z.B. alle Feedback-Gespraeche eines Mitarbeiters auf einen Blick zu sehen.

### Passwort aendern

Ueber die Sidebar: Altes Passwort eingeben, neues setzen. Danach musst du dich nicht neu einloggen — die Session bleibt aktiv.

### Name aendern

Der angezeigte Name auf dem Splash-Screen. Klicke auf das Stift-Icon neben deinem Namen in der Sidebar.

### Datenschutz

Erreichbar ueber das Schild-Icon in der Sidebar. Die Datenschutz-Seite erklaert:
- **Wo deine Daten liegen:** Lokal auf deinem Rechner, in einem geschuetzten App-Verzeichnis
- **Was gespeichert wird:** Mitarbeiterdaten, Projekte, Notizen, Jour-Fixe-Protokolle
- **KI-Datenverarbeitung:** Was bei Cloud-Providern gesendet wird und was bei Ollama lokal bleibt
- **Keine Telemetrie:** Unisono sendet keine Nutzungsdaten, keine Analytics, keine Crash-Reports

---

## 10. Tipps & Best Practices

### Woechentlicher Rhythmus

Ein bewaehrter Arbeitsablauf:

| Wann | Was tun | Wo in Unisono |
|------|---------|---------------|
| **Montag** | Dashboard checken: Wer braucht Aufmerksamkeit? | Dashboard → Radar |
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
- **Massnahmen konkret formulieren:** "Praesentationstraining bis Q2" statt "Weiterentwicklung Kommunikation"
- **Offene Massnahmen** erscheinen automatisch in den "Offenen Punkten" — so gehen sie nicht unter
- **Im JF besprechen:** Der Entwicklungs-Tab in der JF-Seitenleiste zeigt Massnahmen und Weiterbildungen zum Durchsprechen

### Suche nutzen

Das Suchfeld in der Sidebar filtert gleichzeitig Mitarbeiter und Projekte. Tippe einen Teil des Namens ein, um schnell zu navigieren.

### Demo-Daten zum Lernen

Lade die Demo-Daten, experimentiere frei, und entferne sie wieder wenn du bereit bist, mit echten Daten zu arbeiten. Die Demo-Daten zeigen realistische Szenarien mit absichtlichen "Problemfaellen" (ueberfaellige Punkte, schlechte Stimmung), damit du alle Features kennenlernst.

> **Szenario: Halbjahresgespraech vorbereiten**
>
> Ende Juni steht das Halbjahresgespraech mit Tom an. So bereitest du dich vor:
>
> 1. **Historie-Tab:** Scrolle durch die letzten 6 JF-Sitzungen — wie hat sich die Stimmung entwickelt? Welche Themen kamen immer wieder?
> 2. **Notizen-Tab:** Filtere nach Tag "Feedback" — was hast du Tom in den letzten Monaten zurueckgemeldet?
> 3. **Entwicklung-Tab:** Pruefe den STEPs-Plan — welche Massnahmen sind erledigt, welche offen? Wie sieht die Leistungseinschaetzung aus?
> 4. **Zielvereinbarungen:** Welche Ziele hat Tom fuer Q1/Q2 erreicht, welche nicht?
> 5. **KI-Briefing:** Lass dir eine Zusammenfassung generieren — die KI sieht alle Daten und fasst die Lage zusammen.
>
> Mit diesen 5 Schritten hast du in 10 Minuten einen vollstaendigen Ueberblick ueber ein halbes Jahr Zusammenarbeit.

---

## 11. Loeschen & Konsequenzen

Unisono fragt bei allen Loeschvorgaengen per Dialog nach Bestaetigung. Trotzdem gut zu wissen, was dabei passiert:

### Mitarbeiter loeschen

Entfernt den Mitarbeiter und alle zugehoerigen Daten:
- Alle Notizen, Vereinbarungen, Zielvereinbarungen
- Alle JF-Sitzungen und Protokolle
- Entwicklungsplaene (mit Staerken, Feldern, Massnahmen, Weiterbildungen)
- Foto
- Mitgliedschaften in Projekten (die Projekte selbst bleiben bestehen)

**Nicht rueckgaengig zu machen.** Wenn du unsicher bist, schreibe vorher eine Notiz mit den wichtigsten Informationen, die du behalten willst.

### Projekt loeschen

Entfernt das Projekt und alle zugehoerigen Daten:
- Alle Milestones (mit Status-Historie)
- Alle KPIs (mit Werte-Historie)
- Alle Teammitgliedschaften (die Mitarbeiter selbst bleiben bestehen)
- Projektzuordnung wird von betroffenen Vereinbarungen und JF-Notizen entfernt

**Nicht rueckgaengig zu machen.**

### Einzelne Elemente loeschen

| Element | Was passiert |
|---------|-------------|
| **Milestone** | Wird entfernt, verschwindet aus Fortschrittsanzeige |
| **KPI** | Wird entfernt, inklusive Werte-Historie |
| **Vereinbarung** | Wird entfernt — von Mitarbeiter- und Projektseite |
| **Notiz** | Wird entfernt (inkl. Tags) |
| **Ziel** | Wird entfernt |
| **Entwicklungsfeld** | Wird mit allen Massnahmen entfernt |
| **Massnahme** | Wird entfernt, verschwindet aus "Offene Punkte" |
| **Weiterbildung** | Wird entfernt |
| **Staerke** | Wird entfernt |
| **Tag** | Wird entfernt — auch von allen Notizen die diesen Tag hatten |
| **Agenda-Punkt** | Wird entfernt (oder automatisch nach JF) |

### Demo-Daten entfernen

Loescht **alle** Daten in der App — nicht nur die Demo-Daten. Die App ist danach komplett leer (wie nach einer Neuinstallation). Dein Passwort und dein Name bleiben bestehen.

---

## Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **Jour Fixe (JF)** | Regelmaessiges Einzelgespraech zwischen Teamlead und Mitarbeiter |
| **Milestone** | Meilenstein eines Projekts mit Status und optionalem Faelligkeitsdatum |
| **KPI** | Kennzahl (Key Performance Indicator) — messbare Groesse eines Projekts |
| **Vereinbarung** | Absprache mit einem Mitarbeiter, optional einem Projekt zugeordnet |
| **Offene Punkte** | Sammelansicht: offene Vereinbarungen + Entwicklungsmassnahmen |
| **Entwicklungsfeld** | Bereich in dem sich ein Mitarbeiter weiterentwickeln soll |
| **Massnahme** | Konkreter Schritt innerhalb eines Entwicklungsfeldes |
| **STEPs** | Framework fuer den strukturierten Entwicklungsplan |
| **Zielvereinbarung** | Konkretes, messbares Ziel mit Kategorie, Status und Faelligkeit |
| **Stimmung / Mood** | 5-stufige Stimmungseinschaetzung im JF (schlecht bis gut) |
| **Aufmerksamkeits-Radar** | Automatisches Scoring das zeigt, welche Mitarbeiter Aufmerksamkeit brauchen |
| **Tag** | Farbige Markierung auf Notizen zur Kategorisierung und Filterung |
| **Onboarding-Tour** | Gefuehrte Tooltips die die wichtigsten Bereiche erklaeren |
| **Ueberfaellig / Overdue** | Faelligkeitsdatum ueberschritten und noch nicht erledigt — wird rot hervorgehoben |
| **Inline-Edit** | Bearbeitung direkt in der Ansicht (Stift-Icon beim Hovern) ohne separates Formular |
