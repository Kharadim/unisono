import { Shield, Database, FileText, Bot, Lock, Users, ClipboardList } from 'lucide-react'

interface InfoCardProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function InfoCard({ icon, title, children }: InfoCardProps) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-2 ml-12">
        {children}
      </div>
    </div>
  )
}

export function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Datenschutz</h1>
          <p className="text-sm text-muted-foreground">Informationen zum Umgang mit Mitarbeiterdaten</p>
        </div>
      </div>

      <InfoCard icon={<Database className="h-5 w-5 text-primary" />} title="Datenspeicherung">
        <p>Alle Daten werden <strong>ausschliesslich lokal</strong> auf diesem Computer gespeichert.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>SQLite-Datenbank im Programmordner (<code className="text-xs bg-muted px-1 py-0.5 rounded">backend/data/teamlead.db</code>)</li>
          <li>Keine Cloud, kein externer Server, keine automatische Synchronisation</li>
          <li>Fotos werden lokal als Dateien gespeichert</li>
        </ul>
      </InfoCard>

      <InfoCard icon={<FileText className="h-5 w-5 text-primary" />} title="Gespeicherte Datenarten">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Mitarbeiterdaten:</strong> Name, Rolle, Abteilung, Startdatum, Foto</li>
          <li><strong>Leistungsdaten:</strong> Projekte, KPIs, Milestones, Stimmungswerte</li>
          <li><strong>Gespraechsnotizen:</strong> Jour-Fixe-Protokolle, allgemeine Notizen</li>
          <li><strong>Entwicklungsplaene:</strong> STEPs-Bogen, Ziele, Massnahmen, Weiterbildungen</li>
          <li><strong>Vereinbarungen:</strong> Offene und erledigte Vereinbarungen mit Faelligkeit</li>
        </ul>
      </InfoCard>

      <InfoCard icon={<Bot className="h-5 w-5 text-primary" />} title="KI-Funktionen (wenn aktiviert)">
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="font-medium text-green-800 text-xs mb-1">Ohne KI / Ollama lokal</p>
            <p className="text-green-700">Keine Daten verlassen den Rechner. Bei Ollama laeuft das KI-Modell vollstaendig lokal.</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-medium text-amber-800 text-xs mb-1">Cloud-APIs (Gemini, OpenAI, Anthropic)</p>
            <p className="text-amber-700">Mitarbeiterdaten werden an externe Server gesendet. Pruefe vor der Nutzung:</p>
            <ul className="list-disc list-inside text-amber-700 mt-1 space-y-0.5">
              <li>Ist der Provider im Unternehmen freigegeben?</li>
              <li>Existiert ein Data Processing Agreement (DPA)?</li>
              <li>Hat der Betriebsrat / DSB die Nutzung genehmigt?</li>
            </ul>
          </div>
        </div>
      </InfoCard>

      <InfoCard icon={<Lock className="h-5 w-5 text-primary" />} title="Sicherheitsmassnahmen">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Passwortschutz:</strong> Zugang zum Tool ist mit Passwort geschuetzt</li>
          <li><strong>Empfehlung:</strong> BitLocker / Festplattenverschluesselung aktivieren</li>
          <li><strong>Empfehlung:</strong> PC-Sperrbildschirm bei Abwesenheit nutzen (Win+L)</li>
          <li><strong>Empfehlung:</strong> Regelmaessige Backups der Datenbank anlegen</li>
        </ul>
      </InfoCard>

      <InfoCard icon={<Users className="h-5 w-5 text-primary" />} title="Mitarbeiterrechte (Art. 15 DSGVO)">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Auskunftsrecht:</strong> Mitarbeiter koennen alle ueber sie gespeicherten Daten einsehen</li>
          <li><strong>Loeschung:</strong> Daten koennen jederzeit vollstaendig geloescht werden</li>
          <li><strong>Berichtigung:</strong> Fehlerhafte Daten muessen korrigiert werden</li>
        </ul>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mt-2">
          <p className="text-blue-700 text-xs">
            <strong>Tipp:</strong> Formuliere Notizen so, dass du sie dem Mitarbeiter zeigen koenntest. Vermeide rein subjektive Wertungen ohne Sachbezug.
          </p>
        </div>
      </InfoCard>

      <InfoCard icon={<ClipboardList className="h-5 w-5 text-primary" />} title="Empfehlungen fuer den Einsatz">
        <ul className="list-disc list-inside space-y-1">
          <li>Tool ins <strong>Verzeichnis der Verarbeitungstaetigkeiten</strong> (VVT) aufnehmen</li>
          <li>Mitarbeiter in Datenschutzhinweisen ueber die Datenverarbeitung informieren</li>
          <li>Regelmaessig nicht mehr benoetigte Daten loeschen</li>
          <li>Keine Gesundheitsdaten oder rein private Informationen speichern</li>
          <li>Bei Teamwechsel: Daten des ausscheidenden Mitarbeiters loeschen oder uebergeben</li>
        </ul>
      </InfoCard>
    </div>
  )
}
