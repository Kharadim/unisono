import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Printer } from 'lucide-react'

const MOOD_EMOJIS: Record<number, string> = { 1: '\u{1F61E}', 2: '\u{1F615}', 3: '\u{1F610}', 4: '\u{1F642}', 5: '\u{1F60A}' }

const GOAL_STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_arbeit: 'In Arbeit',
  erreicht: 'Erreicht',
  nicht_erreicht: 'Nicht erreicht',
}

const GOAL_CATEGORY_LABELS: Record<string, string> = {
  fachlich: 'Fachlich',
  persoenlich: 'Persönlich',
  fuehrung: 'Führung',
}

const MEASURE_STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

const TRAINING_STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: 'Vorgeschlagen',
  genehmigt: 'Genehmigt',
  abgeschlossen: 'Abgeschlossen',
}

const PRIORITY_LABELS: Record<string, string> = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
}

interface ProtocolData {
  session_id: number
  employee_name: string
  employee_role: string
  employee_department: string
  started_at: string
  completed_at: string | null
  mood: number | null
  mood_label: string
  general_notes: string
  general_notes_tags: string
  project_notes: { project_name: string; notes: string; tags: string }[]
  agreements_created: { content: string; due_date: string | null; project_name: string | null }[]
  goals_at_time: { title: string; status: string; category: string; due_date: string | null; period: string }[]
  devplan_areas: { title: string; priority: string; measures: { content: string; status: string; due_date: string | null }[] }[]
  steps_summary: { performance_rating: string; performance_label: string; talent_pool: string; talent_label: string } | null
  devplan_trainings: { content: string; status: string; provider: string; cost: string; due_date: string | null }[]
}

export function JourFixProtocolPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  const { data: protocol, isLoading } = useQuery<ProtocolData>({
    queryKey: ['jourfix-protocol', sessionId],
    queryFn: () => api.getJourfixProtocol(Number(sessionId)),
  })

  if (isLoading) return <LoadingSpinner />
  if (!protocol) return <div className="p-8">Protokoll nicht gefunden</div>

  const activeGoals = protocol.goals_at_time.filter(g => g.status === 'offen' || g.status === 'in_arbeit')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Navigation — hidden in print */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Drucken / PDF
        </Button>
      </div>

      {/* Protocol Content */}
      <div className="protocol-content">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-1">Jour Fixe Protokoll</h1>
          <div className="flex items-baseline gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground text-lg">{protocol.employee_name}</span>
            {protocol.employee_role && <span>{protocol.employee_role}</span>}
            {protocol.employee_department && <span>— {protocol.employee_department}</span>}
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm">
            <span>
              <strong>Datum:</strong> {protocol.completed_at ? formatDate(protocol.completed_at) : formatDate(protocol.started_at)}
            </span>
            {protocol.mood != null && (
              <span>
                <strong>Stimmung:</strong> {MOOD_EMOJIS[protocol.mood]} {protocol.mood_label}
              </span>
            )}
          </div>
        </div>

        {/* General Notes */}
        {protocol.general_notes && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">Allgemeine Notizen</h2>
            <p className="text-sm whitespace-pre-line">{protocol.general_notes}</p>
          </section>
        )}

        {/* Project Notes */}
        {protocol.project_notes.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">Projekt-Notizen</h2>
            <div className="space-y-4">
              {protocol.project_notes.map((pn, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-muted-foreground">{pn.project_name}</h3>
                  <p className="text-sm whitespace-pre-line mt-1">{pn.notes}</p>
                  {pn.tags && (
                    <div className="flex gap-1 mt-1">
                      {pn.tags.split(',').filter(Boolean).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Agreements */}
        {protocol.agreements_created.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">Neue Vereinbarungen</h2>
            <ul className="space-y-2">
              {protocol.agreements_created.map((ag, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <span>{ag.content}</span>
                    {ag.due_date && (
                      <span className="text-muted-foreground ml-2">(Fällig: {formatDate(ag.due_date)})</span>
                    )}
                    {ag.project_name && (
                      <span className="text-muted-foreground ml-2">— {ag.project_name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">Aktuelle Ziele</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1.5 font-medium">Ziel</th>
                  <th className="py-1.5 font-medium w-24">Kategorie</th>
                  <th className="py-1.5 font-medium w-24">Status</th>
                  <th className="py-1.5 font-medium w-28">Fällig</th>
                </tr>
              </thead>
              <tbody>
                {activeGoals.map((g, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5">{g.title}</td>
                    <td className="py-1.5 text-muted-foreground">{GOAL_CATEGORY_LABELS[g.category] || g.category}</td>
                    <td className="py-1.5 text-muted-foreground">{GOAL_STATUS_LABELS[g.status] || g.status}</td>
                    <td className="py-1.5 text-muted-foreground">{g.due_date ? formatDate(g.due_date) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Development Areas */}
        {protocol.devplan_areas && protocol.devplan_areas.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">Entwicklungsfelder</h2>
            <div className="space-y-3">
              {protocol.devplan_areas.map((area, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold">
                    {area.title}
                    <span className="font-normal text-muted-foreground ml-2">({PRIORITY_LABELS[area.priority] || area.priority})</span>
                  </h3>
                  <ul className="mt-1 space-y-1">
                    {area.measures.map((m, j) => (
                      <li key={j} className="text-sm flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        <div>
                          <span>{m.content}</span>
                          <span className="text-muted-foreground ml-2">
                            [{MEASURE_STATUS_LABELS[m.status] || m.status}]
                          </span>
                          {m.due_date && (
                            <span className="text-muted-foreground ml-1">(Fällig: {formatDate(m.due_date)})</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STEPs Summary */}
        {protocol.steps_summary && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">STEPs-Zusammenfassung</h2>
            <div className="text-sm space-y-1">
              <p><strong>Leistungseinschätzung:</strong> {protocol.steps_summary.performance_label}</p>
              {protocol.steps_summary.talent_pool && (
                <p><strong>Talent Pool:</strong> {protocol.steps_summary.talent_label}</p>
              )}
            </div>
          </section>
        )}

        {/* Trainings */}
        {protocol.devplan_trainings && protocol.devplan_trainings.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">Weiterbildungen</h2>
            <ul className="space-y-2">
              {protocol.devplan_trainings.map((t, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <span>{t.content}</span>
                    <span className="text-muted-foreground ml-2">
                      [{TRAINING_STATUS_LABELS[t.status] || t.status}]
                    </span>
                    {t.provider && (
                      <span className="text-muted-foreground ml-1">— {t.provider}</span>
                    )}
                    {t.cost && (
                      <span className="text-muted-foreground ml-1">({t.cost})</span>
                    )}
                    {t.due_date && (
                      <span className="text-muted-foreground ml-1">(Fällig: {formatDate(t.due_date)})</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
          Generiert am {new Date().toLocaleDateString('de-DE')} — Unisono
        </div>
      </div>
    </div>
  )
}
