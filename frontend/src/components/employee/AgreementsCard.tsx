import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, isOverdue, cn } from '@/lib/utils'
import { ClipboardList, Handshake, Target, Plus, CheckCircle2, Circle, Trash2, AlertTriangle, ChevronDown, Edit2, Save } from 'lucide-react'
import type { Agreement, Project } from '@/types'

interface AgreementsCardProps {
  employeeId: number
  projects: Project[] | { id: number; name: string; status: string }[]
}

interface DevMeasure {
  id: number
  content: string
  status: string
  due_date: string | null
  area_title: string
}

export function AgreementsCard({ employeeId, projects }: AgreementsCardProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editProjectId, setEditProjectId] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data: agreements = [] } = useQuery<Agreement[]>({
    queryKey: ['agreements', employeeId],
    queryFn: () => api.getAgreements(employeeId),
  })

  const { data: devPlans = [] } = useQuery<any[]>({
    queryKey: ['devplan', employeeId],
    queryFn: () => api.getDevPlans(employeeId),
  })

  // Extract open dev measures from newest plan
  const openMeasures: DevMeasure[] = []
  if (devPlans.length > 0) {
    const plan = devPlans[0] // newest
    for (const area of plan.areas || []) {
      for (const m of area.measures || []) {
        if (m.status !== 'erledigt') {
          openMeasures.push({
            id: m.id,
            content: m.content,
            status: m.status,
            due_date: m.due_date,
            area_title: area.title,
          })
        }
      }
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createAgreement(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements', employeeId] })
      setContent('')
      setDueDate('')
      setProjectId('')
      setShowForm(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.toggleAgreement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agreements', employeeId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateAgreement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements', employeeId] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements', employeeId] })
      setConfirmDelete(null)
    },
  })

  const toggleMeasureMutation = useMutation({
    mutationFn: (id: number) => api.toggleDevMeasure(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devplan', employeeId] }),
  })

  const openAgreements = agreements.filter(a => a.status === 'offen')
  const completedAgreements = agreements.filter(a => a.status === 'erledigt')
  const overdueAgreements = openAgreements.filter(a => isOverdue(a.due_date)).length
  const overdueMeasures = openMeasures.filter(m => isOverdue(m.due_date)).length
  const totalOverdue = overdueAgreements + overdueMeasures
  const totalOpen = openAgreements.length + openMeasures.length

  const activeProjects = (projects || []).filter((p: any) => p.status !== 'abgeschlossen')

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Offene Punkte
            {totalOpen > 0 && (
              <Badge variant="secondary" className="text-xs">{totalOpen} offen</Badge>
            )}
            {totalOverdue > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                <AlertTriangle className="h-3 w-3 mr-0.5" />{totalOverdue} überfällig
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Vereinbarung
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create Form */}
        {showForm && (
          <div className="p-3 rounded-md border border-dashed mb-4 space-y-2">
            <Input
              placeholder="Was wurde vereinbart?"
              value={content}
              onChange={e => setContent(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-40"
              />
              {activeProjects.length > 0 && (
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Kein Projekt</option>
                  {activeProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              <Button
                size="sm"
                onClick={() => createMutation.mutate({
                  content: content.trim(),
                  due_date: dueDate || undefined,
                  project_id: projectId ? Number(projectId) : undefined,
                })}
                disabled={!content.trim()}
              >
                Anlegen
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {/* Open Agreements */}
        {openAgreements.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5" /> Vereinbarungen
            </p>
            <div className="space-y-2 mb-4">
              {openAgreements.map(ag => {
                const overdue = isOverdue(ag.due_date)
                if (editingId === ag.id) {
                  return (
                    <div key={ag.id} className="p-3 rounded-md border space-y-2">
                      <Input value={editContent} onChange={e => setEditContent(e.target.value)} />
                      <div className="flex gap-2 flex-wrap">
                        <Input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-40" />
                        {activeProjects.length > 0 && (
                          <select
                            value={editProjectId}
                            onChange={e => setEditProjectId(e.target.value)}
                            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Kein Projekt</option>
                            {activeProjects.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                        <Button size="sm" onClick={() => updateMutation.mutate({ id: ag.id, data: { content: editContent, due_date: editDue || undefined, project_id: editProjectId ? Number(editProjectId) : 0 } })} disabled={!editContent.trim()}>
                          <Save className="h-3.5 w-3.5 mr-1" />Speichern
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Abbrechen</Button>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={ag.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-md border group',
                    overdue && 'border-destructive/50 bg-destructive/5'
                  )}>
                    <button
                      onClick={() => toggleMutation.mutate(ag.id)}
                      className="mt-0.5 flex-shrink-0"
                      title="Als erledigt markieren"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{ag.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {ag.due_date && (
                          <span className={cn('text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            {overdue && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                            Fällig: {formatDate(ag.due_date)}
                          </span>
                        )}
                        {ag.project_name && (
                          <Badge variant="secondary" className="text-xs">{ag.project_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <button onClick={() => { setEditingId(ag.id); setEditContent(ag.content); setEditDue(ag.due_date || ''); setEditProjectId(ag.project_id ? String(ag.project_id) : '') }} className="text-muted-foreground hover:text-foreground" title="Bearbeiten">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(ag.id)} className="text-muted-foreground hover:text-destructive" title="Löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Open Dev Measures */}
        {openMeasures.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Entwicklungsmassnahmen
            </p>
            <div className="space-y-2 mb-4">
              {openMeasures.map(m => {
                const overdue = isOverdue(m.due_date)
                return (
                  <div key={`m-${m.id}`} className={cn(
                    'flex items-start gap-3 p-3 rounded-md border',
                    overdue && 'border-destructive/50 bg-destructive/5'
                  )}>
                    <button
                      onClick={() => toggleMeasureMutation.mutate(m.id)}
                      className="mt-0.5 flex-shrink-0"
                      title="Status wechseln"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{m.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {m.due_date && (
                          <span className={cn('text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            {overdue && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                            Fällig: {formatDate(m.due_date)}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">{m.area_title}</Badge>
                        {m.status === 'in_arbeit' && (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">in Arbeit</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Empty state */}
        {openAgreements.length === 0 && openMeasures.length === 0 && !showForm && (
          <EmptyState
            icon={ClipboardList}
            title="Keine offenen Punkte"
            description="Vereinbarungen aus Gesprächen oder Entwicklungsmassnahmen erscheinen hier."
          />
        )}

        {/* Completed Agreements */}
        {completedAgreements.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform', !showCompleted && '-rotate-90')} />
              {completedAgreements.length} erledigt
            </button>
            {showCompleted && (
              <div className="space-y-2 mt-2">
                {completedAgreements.map(ag => (
                  <div key={ag.id} className="flex items-start gap-3 p-3 rounded-md border opacity-60 group">
                    <button onClick={() => toggleMutation.mutate(ag.id)} className="mt-0.5 flex-shrink-0" title="Wieder öffnen">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-through">{ag.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {ag.project_name && <Badge variant="secondary" className="text-xs">{ag.project_name}</Badge>}
                        {ag.completed_at && <span className="text-xs text-muted-foreground">Erledigt: {formatDate(ag.completed_at)}</span>}
                      </div>
                    </div>
                    <button onClick={() => setConfirmDelete(ag.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0" title="Löschen">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete !== null}
          onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete) }}
          onCancel={() => setConfirmDelete(null)}
          title="Vereinbarung löschen"
          message="Diese Vereinbarung wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
      </CardContent>
    </Card>
  )
}
