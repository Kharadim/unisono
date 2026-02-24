import { useState, useMemo } from 'react'
import { HelpCircle, Rocket, LayoutDashboard, Users, FolderKanban, MessageSquare, TrendingUp, Settings, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface HelpTopic {
  id: string
  title: string
  keywords: string
  content: () => React.ReactNode
}

interface HelpCategory {
  title: string
  icon: React.ReactNode
  topics: HelpTopic[]
}

const HELP_DATA: HelpCategory[] = [
  {
    title: 'Erste Schritte',
    icon: <Rocket className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'einrichten',
        title: 'App einrichten',
        keywords: 'passwort name start installation setup ersteinrichtung',
        content: () => (
          <>
            <p>Beim ersten Start legst du ein <strong>Passwort</strong> fest (mindestens 4 Zeichen) und gibst deinen Namen ein. Beides bleibt dauerhaft gespeichert und schuetzt deine Daten vor unbefugtem Zugriff.</p>
            <p>Danach kannst du sofort mit eigenen Daten starten oder zuerst Demo-Daten laden, um die App kennenzulernen.</p>
            <p><strong>Tipp:</strong> Dein Name und Passwort lassen sich jederzeit ueber die Sidebar aendern.</p>
          </>
        ),
      },
      {
        id: 'demo-daten',
        title: 'Demo-Daten',
        keywords: 'beispieldaten vorlage template marketing handwerk kanzlei testdaten',
        content: () => (
          <>
            <p>Nach der Ersteinrichtung bietet ein Willkommens-Dialog <strong>drei Branchen-Vorlagen</strong> an: Online Marketing, Elektro-Handwerk und Steuerkanzlei. Jede Vorlage enthaelt realistische Mitarbeiter, Projekte, JF-Sitzungen und absichtlich ueberfaellige Punkte.</p>
            <p>Demo-Daten lassen sich spaeter jederzeit ueber <strong>Sidebar → "Demo-Daten entfernen"</strong> mit einem Klick loeschen. Danach startest du mit einer leeren App fuer deine echten Daten.</p>
            <p><strong>Tipp:</strong> Experimentiere ruhig mit Demo-Daten — du kannst sie jederzeit zuruecksetzen.</p>
          </>
        ),
      },
      {
        id: 'onboarding-tour',
        title: 'Onboarding-Tour',
        keywords: 'tour einfuehrung tooltips anleitung rundgang',
        content: () => (
          <>
            <p>Nach dem Laden von Demo-Daten startet automatisch eine <strong>interaktive Tour</strong> mit Tooltips, die dich durch Dashboard, Mitarbeiter-Seite und Jour Fixe fuehrt.</p>
            <p>Du kannst die Tour jederzeit ueber <strong>Sidebar → "Tour starten"</strong> erneut ausfuehren. Die Tour laeuft auch mit eigenen Daten, solange mindestens ein Mitarbeiter existiert.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'statistik-karten',
        title: 'Statistik-Karten',
        keywords: 'zahlen uebersicht kennzahlen counter metriken',
        content: () => (
          <>
            <p>Fuenf Karten am oberen Rand zeigen dir auf einen Blick: <strong>Mitarbeiterzahl</strong>, aktive Projekte, Milestone-Fortschritt (Prozent), ueberfaellige Milestones und ueberfaellige Vereinbarungen.</p>
            <p>Ueberfaellige Werte werden <strong>rot hervorgehoben</strong>. Beim Hover ueber die Karten siehst du Details zu den betroffenen Items.</p>
            <p><strong>Tipp:</strong> Ein Blick aufs Dashboard am Montagmorgen genuegt, um zu wissen wo es brennt.</p>
          </>
        ),
      },
      {
        id: 'aufmerksamkeits-radar',
        title: 'Aufmerksamkeits-Radar',
        keywords: 'fruehwarnung scoring prioritaet warnung achtung',
        content: () => (
          <>
            <p>Das Aufmerksamkeits-Radar ist dein <strong>Fruehwarnsystem</strong>: Es bewertet automatisch per Scoring, welche Mitarbeiter gerade besondere Aufmerksamkeit brauchen.</p>
            <p>Die Bewertung basiert auf: JF-Rueckstand, schlechte Stimmung, ueberfaellige Vereinbarungen und fehlende Entwicklungsplaene. Je hoeher der Score, desto dringender der Handlungsbedarf.</p>
            <p>Du findest das Radar im <strong>Dashboard</strong> unterhalb der Statistik-Karten.</p>
          </>
        ),
      },
      {
        id: 'projekte-abteilung',
        title: 'Projekte nach Abteilung',
        keywords: 'abteilung gruppierung projektuebersicht fortschritt',
        content: () => (
          <>
            <p>Im unteren Bereich des Dashboards werden alle aktiven Projekte <strong>nach Abteilung gruppiert</strong> angezeigt. Jede Projektkarte zeigt Status, Fortschrittsbalken und Warnzeichen fuer ueberfaellige Milestones.</p>
            <p>Klicke auf ein Projekt, um direkt zur Projektseite zu springen.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Mitarbeiter',
    icon: <Users className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'mitarbeiter-anlegen',
        title: 'Mitarbeiter anlegen',
        keywords: 'neu erstellen hinzufuegen person team foto profil',
        content: () => (
          <>
            <p>Neuen Mitarbeiter legst du ueber das <strong>+ neben "TEAM" in der Sidebar</strong> an. Name und Rolle genuegen zum Start — Abteilung, Verantwortlichkeiten, Startdatum und Foto ergaenzt du spaeter auf der Mitarbeiter-Seite.</p>
            <p>Fotos werden per Drag & Drop oder Klick auf den Avatar hochgeladen und lokal gespeichert.</p>
            <p><strong>Tipp:</strong> Die Abteilung bestimmt die Gruppierung auf dem Dashboard. Vergib sie frueh.</p>
          </>
        ),
      },
      {
        id: 'vier-tabs',
        title: 'Die vier Tabs',
        keywords: 'uebersicht entwicklung notizen historie reiter tab',
        content: () => (
          <>
            <p>Jede Mitarbeiter-Seite hat <strong>vier Tabs</strong>:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Uebersicht:</strong> Projekte, offene Punkte, JF-Vorbereitung, Stimmung</li>
              <li><strong>Entwicklung:</strong> STEPs-Entwicklungsplan und Zielvereinbarungen</li>
              <li><strong>Notizen:</strong> Durchsuchbares Archiv mit Monatsgruppierung und Tag-Filter</li>
              <li><strong>Historie:</strong> Stimmungsverlauf der letzten 12 JFs und alle vergangenen Sitzungen</li>
            </ul>
          </>
        ),
      },
      {
        id: 'offene-punkte',
        title: 'Offene Punkte',
        keywords: 'vereinbarung massnahme ueberfaellig todo aufgabe offen erledigt',
        content: () => (
          <>
            <p>Unter <strong>Mitarbeiter → Uebersicht → Offene Punkte</strong> laufen operative Vereinbarungen und strategische Entwicklungsmassnahmen zusammen. Eine Badge zeigt die Gesamtzahl.</p>
            <p>Ueberfaellige Punkte werden <strong>rot hervorgehoben</strong>. Du kannst sie direkt abhaken oder per Klick bearbeiten (Text und Faelligkeitsdatum sind inline editierbar).</p>
            <p><strong>Tipp:</strong> Offene Punkte erscheinen auch im Jour Fixe, damit nichts vergessen wird.</p>
          </>
        ),
      },
      {
        id: 'notizen-tags',
        title: 'Notizen & Tags',
        keywords: 'notiz schreiben filtern suchen tag farbe markierung kategorie',
        content: () => (
          <>
            <p>Im <strong>Tab "Notizen"</strong> erstellst du freie Notizen und vergibst dabei Tags (z.B. Feedback, Lob, Vereinbarung). Notizen werden automatisch nach Monat gruppiert.</p>
            <p>Ueber den <strong>Tag-Filter</strong> oben kannst du gezielt nach bestimmten Kategorien filtern — ideal fuer die Vorbereitung von Halbjahresgespraechen.</p>
            <p>Tags verwaltest du zentral ueber <strong>Sidebar → "Tags verwalten"</strong>. Dort kannst du eigene Tags mit Namen und Farbe anlegen.</p>
          </>
        ),
      },
      {
        id: 'jf-vorbereitung',
        title: 'JF-Vorbereitung',
        keywords: 'agenda themen sammeln vorbereiten checkliste woche',
        content: () => (
          <>
            <p>Unter <strong>Mitarbeiter → Uebersicht → JF-Vorbereitung</strong> sammelst du unter der Woche Themen fuer das naechste Jour Fixe. Optional ordnest du jedes Thema einem Projekt zu.</p>
            <p>Beim Start eines Jour Fixe erscheinen alle vorbereiteten Themen als <strong>abhakbare Checkliste</strong> in der Seitenleiste.</p>
            <p><strong>Tipp:</strong> Notiere Themen sofort, wenn sie dir einfallen — so vergisst du bis zum naechsten JF nichts.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Projekte',
    icon: <FolderKanban className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'projekt-anlegen',
        title: 'Projekt anlegen',
        keywords: 'neu erstellen projekt scope beschreibung status',
        content: () => (
          <>
            <p>Neue Projekte erstellst du ueber <strong>Mitarbeiter → Uebersicht → "Projekt"</strong>. Der Mitarbeiter wird automatisch als Mitglied hinzugefuegt.</p>
            <p>Jedes Projekt hat einen Namen, eine Beschreibung (Scope) und einen Status: <strong>Aktiv</strong>, <strong>Pausiert</strong> oder <strong>Abgeschlossen</strong>. Pausierte Projekte zeigen "||" in der Sidebar, abgeschlossene werden ausgeblendet.</p>
          </>
        ),
      },
      {
        id: 'milestones',
        title: 'Milestones',
        keywords: 'meilenstein etappe fortschritt status offen erledigt faellig deadline',
        content: () => (
          <>
            <p>Milestones sind die Etappen deines Projekts. Erstelle sie auf der <strong>Projektseite</strong> mit Name und optionalem Faelligkeitsdatum.</p>
            <p>Status per Klick durchschalten: <strong>Offen → In Arbeit → Erledigt</strong>. Name und Datum sind inline bearbeitbar. Ueberfaellige Milestones werden rot markiert und zaehlen auf dem Dashboard.</p>
            <p>Per Drag & Drop aenderst du die Reihenfolge. Der Fortschrittsbalken oben zeigt den Anteil erledigter Milestones.</p>
            <p><strong>Tipp:</strong> Setze immer ein Faelligkeitsdatum — nur so greift die Ueberfaellig-Warnung.</p>
          </>
        ),
      },
      {
        id: 'kpis',
        title: 'KPIs',
        keywords: 'kennzahl metrik wert einheit messung tracking historie',
        content: () => (
          <>
            <p>KPIs zeigen messbare Kennzahlen mit <strong>Label, Wert und Einheit</strong> (z.B. "CTR: 3,2 %"). Erstelle sie auf der Projektseite.</p>
            <p>Jede Wertaenderung wird automatisch in der <strong>KPI-Historie</strong> protokolliert — klicke auf das Uhr-Icon neben einem KPI, um den Verlauf zu sehen.</p>
            <p>Im Jour Fixe aktualisierst du KPI-Werte direkt, und die Aenderung wird im Protokoll dokumentiert.</p>
          </>
        ),
      },
      {
        id: 'team-verlauf',
        title: 'Team & Verlauf',
        keywords: 'mitglieder rolle projektteam aenderungsprotokoll history',
        content: () => (
          <>
            <p>In der <strong>Team-Seitenleiste</strong> der Projektseite verwaltest du Mitglieder und vergibst Projektrollen per Inline-Bearbeitung (z.B. "Projektleitung", "SEA-Spezialist").</p>
            <p>Der <strong>Verlauf</strong> am Ende der Projektseite protokolliert automatisch alle Aenderungen: Statuswechsel, Milestone-Updates, KPI-Anpassungen und JF-Notizen — mit Datum und altem/neuem Wert.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Jour Fixe',
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'jf-start',
        title: 'Vorbereitung & Start',
        keywords: 'starten beginnen session oeffnen vorbereiten briefing',
        content: () => (
          <>
            <p>Sammle unter der Woche Themen auf der <strong>Mitarbeiter-Seite → Uebersicht → JF-Vorbereitung</strong>. Optional nutzt du das KI-Briefing ("JF vorbereiten"), das JF-Historie, offene Punkte und Stimmungsverlauf analysiert.</p>
            <p>Starte die Session ueber den <strong>"Jour Fixe"-Button auf der Mitarbeiter-Seite</strong>. Falls noch eine alte Session offen ist, wirst du gefragt: fortsetzen, verwerfen oder neu starten.</p>
          </>
        ),
      },
      {
        id: 'jf-waehrend',
        title: 'Waehrend des Gespraechs',
        keywords: 'akkordeon projekte notizen status aendern bearbeiten seitenleiste',
        content: () => (
          <>
            <p>Das <strong>Zwei-Spalten-Layout</strong> zeigt links ein Projekt-Akkordeon und rechts eine Seitenleiste.</p>
            <p><strong>Links (Projekte):</strong> Status aendern, Milestones abhaken oder anlegen, KPIs aktualisieren, Gespraechsnotizen und Statuszeile schreiben, neue Vereinbarungen erstellen.</p>
            <p><strong>Rechts (Seitenleiste):</strong> Vorbereitete Themen als Checkliste, offene Punkte zum Abhaken (Vereinbarungen + Massnahmen), Ziele und Entwicklung im Entwicklungs-Tab, sowie Stimmungswahl und allgemeine Notizen.</p>
            <p>Dein Entwurf wird <strong>alle 2 Sekunden automatisch gesichert</strong> — bei einem Absturz geht nichts verloren.</p>
          </>
        ),
      },
      {
        id: 'gespraechsleitfaden',
        title: 'Gespraechsleitfaden',
        keywords: 'leitfaden struktur phasen fragen checkin rueckblick ausblick',
        content: () => (
          <>
            <p>Ein einklappbarer <strong>Gespraechsleitfaden</strong> oben im Jour Fixe gibt dir Struktur mit vier Phasen:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Check-in:</strong> Wie geht es dir? Was beschaeftigt dich gerade?</li>
              <li><strong>Rueckblick:</strong> Was lief gut? Wo gab es Schwierigkeiten?</li>
              <li><strong>Aktuelle Themen:</strong> Vorbereitete Agenda-Punkte durchgehen</li>
              <li><strong>Ausblick:</strong> Naechste Schritte, Vereinbarungen festhalten</li>
            </ul>
            <p className="mt-1"><strong>Tipp:</strong> Der Leitfaden ist optional — nutze ihn als Orientierung, nicht als starres Korsett.</p>
          </>
        ),
      },
      {
        id: 'jf-abschluss',
        title: 'Abschliessen & Protokoll',
        keywords: 'fertig speichern zusammenfassung protokoll pdf drucken abschliessen',
        content: () => (
          <>
            <p>Beim Klick auf <strong>"Abschliessen"</strong> zeigt eine Zusammenfassung alle Aenderungen: neue Vereinbarungen, Statuswechsel, aktualisierte KPIs und Notizen.</p>
            <p>Nach Bestaetigung wird alles <strong>atomar gespeichert</strong> (alles oder nichts). Danach erscheint ein Erfolgsbildschirm mit Link zum druckfertigen Protokoll.</p>
            <p>Das Protokoll kannst du ueber <strong>Strg+P</strong> als PDF speichern oder direkt drucken. Es ist auch spaeter ueber <strong>Mitarbeiter → Historie</strong> erreichbar.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Entwicklung & Ziele',
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'entwicklungsplan',
        title: 'Entwicklungsplan (STEPs)',
        keywords: 'steps bogen halbjahr jahresgespraech reflexion leistung potenzial',
        content: () => (
          <>
            <p>Der Entwicklungsplan dient als Grundlage fuer Halbjahres- oder Jahresgespraeche. Erstelle ihn unter <strong>Mitarbeiter → Tab "Entwicklung" → "Neuer Plan"</strong> mit einer Periode (z.B. "2026").</p>
            <p>Jeder Plan umfasst: vier Reflexions-Textfelder, eine Staerkenliste, Entwicklungsfelder mit konkreten Massnahmen, eine Leistungs- und Potenzialeinschaetzung sowie Weiterbildungen.</p>
            <p>Offene Massnahmen aus dem neuesten Plan erscheinen automatisch auf dem <strong>Uebersicht-Tab unter "Offene Punkte"</strong>.</p>
          </>
        ),
      },
      {
        id: 'staerken-felder',
        title: 'Staerken & Entwicklungsfelder',
        keywords: 'staerke kompetenz feld bereich massnahme prioritaet',
        content: () => (
          <>
            <p><strong>Staerken</strong> sind frei formulierbare Eintraege, die die Kernkompetenzen des Mitarbeiters festhalten (z.B. "Hervorragende Datenanalyse-Faehigkeiten").</p>
            <p><strong>Entwicklungsfelder</strong> beschreiben Bereiche mit Verbesserungspotenzial. Jedes Feld hat eine Prioritaet (Hoch/Mittel/Niedrig) und enthaelt konkrete <strong>Massnahmen</strong> mit Status (Offen → In Arbeit → Erledigt) und optionalem Faelligkeitsdatum.</p>
            <p>Massnahmen lassen sich auch im Jour Fixe besprechen und statusmaessig aktualisieren.</p>
          </>
        ),
      },
      {
        id: 'zielvereinbarungen',
        title: 'Zielvereinbarungen',
        keywords: 'ziel vereinbarung fachlich persoenlich fuehrung periode quartal',
        content: () => (
          <>
            <p>Zielvereinbarungen sind konkrete, messbare Ziele — unabhaengig vom Entwicklungsplan. Erstelle sie unter <strong>Mitarbeiter → Tab "Entwicklung"</strong>.</p>
            <p>Jedes Ziel hat eine <strong>Kategorie</strong> (Fachlich, Persoenlich, Fuehrung), eine Faelligkeit und eine Periode. Der Status laeuft: Offen → In Arbeit → Erreicht. Alternativ: "Nicht erreicht" ueber das Kontextmenue.</p>
            <p>Im Jour Fixe sind Ziele im <strong>Sidebar-Tab "Entwicklung"</strong> besprechbar und erscheinen im Protokoll.</p>
          </>
        ),
      },
      {
        id: 'steps-vs-ziele',
        title: 'STEPs vs. Ziele',
        keywords: 'unterschied vergleich wann strategisch operativ langfristig',
        content: () => (
          <>
            <p>Beide Werkzeuge ergaenzen sich:</p>
            <table className="text-xs mt-1 w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-3 font-medium">Entwicklungsplan (STEPs)</th>
                  <th className="text-left py-1 font-medium">Zielvereinbarungen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="py-1 pr-3">Langfristige Richtung</td><td className="py-1">Konkrete Meilensteine</td></tr>
                <tr><td className="py-1 pr-3">Halbjahres-/Jahresgespraech</td><td className="py-1">Quartal oder Projekt</td></tr>
                <tr><td className="py-1 pr-3">"Kommunikation verbessern"</td><td className="py-1">"Google-Ads-Zertifizierung bis Q3"</td></tr>
                <tr><td className="py-1 pr-3">Reflexion + Bewertung</td><td className="py-1">Messbar + terminiert</td></tr>
              </tbody>
            </table>
            <p className="mt-2"><strong>Tipp:</strong> Nutze den Plan fuer die Richtung und Ziele fuer die konkreten Schritte.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'KI & Einstellungen',
    icon: <Settings className="h-5 w-5 text-primary" />,
    topics: [
      {
        id: 'ki-einrichten',
        title: 'KI einrichten',
        keywords: 'ollama openai anthropic gemini api key provider einstellungen konfiguration',
        content: () => (
          <>
            <p>Die KI ist <strong>komplett optional</strong> — alle Kernfunktionen arbeiten ohne KI. Richte sie ueber <strong>Sidebar → "KI-Assistent"</strong> ein.</p>
            <p>Waehle zwischen: <strong>Ollama</strong> (lokal, kostenlos, maximaler Datenschutz) oder Cloud-Providern (<strong>Gemini, OpenAI, Anthropic</strong> — eigener API-Key erforderlich).</p>
            <p>Bei Cloud-Providern erscheint beim ersten Senden eine <strong>Datenschutz-Warnung</strong> — du musst aktiv zustimmen, bevor Mitarbeiterdaten uebermittelt werden.</p>
            <p><strong>Tipp:</strong> Teste die Verbindung mit dem "Verbindung testen"-Button, bevor du loslegst.</p>
          </>
        ),
      },
      {
        id: 'chat-widget',
        title: 'Chat-Widget',
        keywords: 'chat ki assistent frage antwort kontext hilfe',
        content: () => (
          <>
            <p>Das Chat-Widget erscheint rechts unten und kennt automatisch den <strong>Kontext der aktuellen Seite</strong> — auf einer Mitarbeiter-Seite weiss die KI alles ueber diesen Mitarbeiter.</p>
            <p>Stelle Fragen wie: "Wie fuehre ich ein kritisches Feedback-Gespraech mit Lisa?" oder "Welche Projekte haben ueberfaellige Milestones?"</p>
            <p>Das Widget ist nur sichtbar, wenn KI in den Einstellungen <strong>aktiviert</strong> ist.</p>
          </>
        ),
      },
      {
        id: 'jf-briefing',
        title: 'JF-Briefing',
        keywords: 'briefing vorbereitung ki analyse empfehlung gespraechsvorbereitung',
        content: () => (
          <>
            <p>Das KI-Briefing analysiert JF-Historie, offene Punkte, Ziele und Stimmungsverlauf und liefert <strong>strukturierte Gespraechsempfehlungen</strong>.</p>
            <p>Starte es ueber <strong>Mitarbeiter → Uebersicht → "JF vorbereiten"</strong>. Die Ergebnisse helfen dir, das naechste Jour Fixe gezielter zu fuehren.</p>
            <p><strong>Voraussetzung:</strong> KI muss aktiviert und konfiguriert sein.</p>
          </>
        ),
      },
      {
        id: 'tags-verwalten',
        title: 'Tags verwalten',
        keywords: 'tag farbe kategorie erstellen loeschen sortieren',
        content: () => (
          <>
            <p>Oeffne die Tag-Verwaltung ueber <strong>Sidebar → "Tags verwalten"</strong>. Dort findest du 7 Standard-Tags und kannst eigene Tags mit Name und Farbe anlegen.</p>
            <p>Tags werden beim Erstellen von Notizen und JF-Gespraechsnotizen vergeben. Du kannst sie per Drag & Drop sortieren.</p>
            <p><strong>Achtung:</strong> Wenn du einen Tag loeschst, wird er auch aus allen bestehenden Notizen entfernt.</p>
          </>
        ),
      },
      {
        id: 'loeschen',
        title: 'Loeschen — was passiert?',
        keywords: 'entfernen unwiderruflich daten verlust mitarbeiter projekt demo',
        content: () => (
          <>
            <p>Beim Loeschen gilt:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Mitarbeiter entfernen:</strong> Loescht alle zugehoerigen Daten (Notizen, JF-Sitzungen, Vereinbarungen, Entwicklungsplaene) unwiderruflich.</li>
              <li><strong>Projekt entfernen:</strong> Loescht Milestones, KPIs und Mitgliedschaften. Mitarbeiter bleiben erhalten.</li>
              <li><strong>"Demo-Daten entfernen":</strong> Leert die gesamte App — alle Mitarbeiter, Projekte und Sitzungen werden geloescht.</li>
            </ul>
            <p className="mt-1"><strong>Tipp:</strong> Alle Loeschaktionen zeigen vorher einen Bestaetigungsdialog. Es gibt keine Papierkorb-Funktion — loeschen ist endgueltig.</p>
          </>
        ),
      },
    ],
  },
]

export function HelpPage() {
  const [search, setSearch] = useState('')
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())

  const toggleTopic = (id: string) => {
    setOpenTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return HELP_DATA
    return HELP_DATA.map(cat => ({
      ...cat,
      topics: cat.topics.filter(t =>
        t.title.toLowerCase().includes(q) || t.keywords.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.topics.length > 0)
  }, [search])

  const totalResults = filtered.reduce((sum, cat) => sum + cat.topics.length, 0)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hilfe</h1>
          <p className="text-sm text-muted-foreground">Tipps und Anleitungen zu allen Funktionen</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Thema suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Result hint */}
      {search.trim() && (
        <p className="text-sm text-muted-foreground">
          {totalResults === 0
            ? 'Keine Treffer gefunden.'
            : `${totalResults} ${totalResults === 1 ? 'Treffer' : 'Treffer'} gefunden.`}
        </p>
      )}

      {/* Categories */}
      {filtered.map(cat => (
        <div key={cat.title}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {cat.icon}
            </div>
            <h2 className="font-semibold text-foreground">{cat.title}</h2>
          </div>

          <div className="space-y-1">
            {cat.topics.map(topic => {
              const isOpen = openTopics.has(topic.id)
              return (
                <div key={topic.id} className="bg-card rounded-lg border">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    {topic.title}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pl-10 text-sm text-muted-foreground space-y-2">
                      {topic.content()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Empty state for no results */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Keine Themen fuer "{search}" gefunden.</p>
          <p className="text-xs text-muted-foreground mt-1">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}
    </div>
  )
}
