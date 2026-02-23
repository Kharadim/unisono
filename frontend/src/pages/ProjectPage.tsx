import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingSpinner } from '@/components/ui/loading'
import { TagPills } from '@/components/ui/tag-selector'
import { formatDate, formatDateTime, statusColor, statusLabel, isOverdue, cn } from '@/lib/utils'
import {
  ArrowLeft, Edit2, Save, X, Trash2, Plus, CheckCircle2, Circle,
  Clock, Target, BarChart3, Users, History, AlertTriangle, Loader2, MessageSquare,
  ChevronUp, ChevronDown, Handshake
} from 'lucide-react'
import type { Project, Milestone, KPI, Employee, StatusHistoryEntry, KPIHistoryEntry } from '@/types'

function MilestoneItem({ milestone, onToggle, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  milestone: Milestone
  onToggle: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const overdue = milestone.status !== 'done' && isOverdue(milestone.due_date)
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-md border',
      overdue && 'border-destructive/50 bg-destructive/5'
    )}>
      <button onClick={onToggle} className="flex-shrink-0 cursor-pointer" title="Klicken zum Umschalten: Offen → In Arbeit → Erledigt">
        {milestone.status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : milestone.status === 'in_arbeit' ? (
          <Loader2 className="h-5 w-5 text-amber-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', milestone.status === 'done' && 'line-through text-muted-foreground')}>
          {milestone.name}
        </p>
        {milestone.due_date && (
          <p className={cn('text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
            Fällig: {formatDate(milestone.due_date)}
          </p>
        )}
      </div>
      <Badge className={statusColor(milestone.status)}>{statusLabel(milestone.status)}</Badge>
      <div className="flex flex-col gap-0.5">
        <button onClick={onMoveUp} disabled={isFirst} className={cn('text-muted-foreground', isFirst ? 'opacity-20' : 'hover:text-foreground')} title="Nach oben">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className={cn('text-muted-foreground', isLast ? 'opacity-20' : 'hover:text-foreground')} title="Nach unten">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" title="Löschen">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', scope: '', status: 'aktiv', status_text: '' })
  const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '' })
  const [showNewMilestone, setShowNewMilestone] = useState(false)
  const [newKPI, setNewKPI] = useState({ label: '', value: '', unit: '' })
  const [showNewKPI, setShowNewKPI] = useState(false)
  const [editingKPI, setEditingKPI] = useState<number | null>(null)
  const [kpiForm, setKpiForm] = useState({ label: '', value: '', unit: '' })
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberStep, setAddMemberStep] = useState<'select' | 'role'>('select')
  const [addMemberSelected, setAddMemberSelected] = useState<Employee | null>(null)
  const [addMemberRole, setAddMemberRole] = useState('')
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [roleForm, setRoleForm] = useState('')
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false)
  const [confirmDeleteMs, setConfirmDeleteMs] = useState<number | null>(null)
  const [confirmDeleteKpi, setConfirmDeleteKpi] = useState<number | null>(null)
  const [showKpiHistory, setShowKpiHistory] = useState<number | null>(null)
  const [kpiHistory, setKpiHistory] = useState<KPIHistoryEntry[]>([])
  const [showAllNotes, setShowAllNotes] = useState(false)
  const [showDoneAgreements, setShowDoneAgreements] = useState(false)

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: api.getEmployees,
  })

  const { data: history = [] } = useQuery<StatusHistoryEntry[]>({
    queryKey: ['project-history', projectId],
    queryFn: () => api.getProjectHistory(projectId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateProject(projectId, data),
    onSuccess: () => { invalidate(); setEditing(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/')
    },
  })

  const toggleMilestoneMutation = useMutation({
    mutationFn: (id: number) => api.toggleMilestone(id),
    onSuccess: invalidate,
  })

  const createMilestoneMutation = useMutation({
    mutationFn: (data: any) => api.createMilestone(projectId, data),
    onSuccess: () => { invalidate(); setShowNewMilestone(false); setNewMilestone({ name: '', due_date: '' }) },
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: number) => api.deleteMilestone(id),
    onSuccess: () => { invalidate(); setConfirmDeleteMs(null) },
  })

  const reorderMilestonesMutation = useMutation({
    mutationFn: (orderedIds: number[]) => api.reorderMilestones(projectId, orderedIds),
    onSuccess: invalidate,
  })

  const createKPIMutation = useMutation({
    mutationFn: (data: any) => api.createKPI(projectId, data),
    onSuccess: () => { invalidate(); setShowNewKPI(false); setNewKPI({ label: '', value: '', unit: '' }) },
  })

  const updateKPIMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateKPI(id, data),
    onSuccess: () => { invalidate(); setEditingKPI(null) },
  })

  const deleteKPIMutation = useMutation({
    mutationFn: (id: number) => api.deleteKPI(id),
    onSuccess: () => { invalidate(); setConfirmDeleteKpi(null) },
  })

  const reorderKPIsMutation = useMutation({
    mutationFn: (orderedIds: number[]) => api.reorderKPIs(projectId, orderedIds),
    onSuccess: invalidate,
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: number; role: string }) =>
      api.addMember(projectId, { employee_id: employeeId, role_in_project: role }),
    onSuccess: () => {
      invalidate()
      setShowAddMember(false)
      setAddMemberStep('select')
      setAddMemberSelected(null)
      setAddMemberRole('')
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: number; role: string }) =>
      api.updateMemberRole(projectId, employeeId, role),
    onSuccess: () => { invalidate(); setEditingRole(null) },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (employeeId: number) => api.removeMember(projectId, employeeId),
    onSuccess: invalidate,
  })

  const toggleAgreementMutation = useMutation({
    mutationFn: (id: number) => api.toggleAgreement(id),
    onSuccess: invalidate,
  })

  const startEditing = () => {
    if (project) {
      setForm({ name: project.name, scope: project.scope, status: project.status, status_text: project.status_text })
      setEditing(true)
    }
  }

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    if (!project) return
    const ids = project.milestones.map(m => m.id)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
    reorderMilestonesMutation.mutate(ids)
  }

  const moveKPI = (index: number, direction: 'up' | 'down') => {
    if (!project) return
    const ids = project.kpis.map(k => k.id)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
    reorderKPIsMutation.mutate(ids)
  }

  const loadKpiHistory = async (kpiId: number) => {
    const data = await api.getKPIHistory(kpiId)
    setKpiHistory(data)
    setShowKpiHistory(kpiId)
  }

  if (isLoading) return <LoadingSpinner />
  if (!project) return <div className="p-8">Projekt nicht gefunden</div>

  const availableEmployees = employees.filter(
    e => !project.members.some(m => m.id === e.id)
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* Project Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Projektname</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Projektname" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Beschreibung / Scope</label>
                <Textarea value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} placeholder="Was ist das Ziel des Projekts?" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    options={[
                      { value: 'aktiv', label: 'Aktiv' },
                      { value: 'pausiert', label: 'Pausiert' },
                      { value: 'abgeschlossen', label: 'Abgeschlossen' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Statuszeile</label>
                  <Input value={form.status_text} onChange={e => setForm({ ...form, status_text: e.target.value })} placeholder="z.B. Keyword-Mapping Phase" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={!form.name.trim()}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Speichern
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge className={statusColor(project.status)}>{statusLabel(project.status)}</Badge>
                <Button size="icon-sm" variant="ghost" onClick={startEditing} title="Bearbeiten"><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDeleteProject(true)} title="Löschen"><Trash2 className="h-4 w-4" /></Button>
              </div>
              {project.status_text && <p className="text-muted-foreground mb-2">{project.status_text}</p>}
              {project.scope && <p className="text-sm whitespace-pre-line">{project.scope}</p>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" /> Milestones
                  <span className="text-sm font-normal text-muted-foreground">
                    ({project.milestones.filter(m => m.status === 'done').length}/{project.milestones.length})
                  </span>
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowNewMilestone(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.milestones.length > 0 ? (
                <div className="space-y-2">
                  {project.milestones.map((ms, i) => (
                    <MilestoneItem
                      key={ms.id}
                      milestone={ms}
                      onToggle={() => toggleMilestoneMutation.mutate(ms.id)}
                      onDelete={() => setConfirmDeleteMs(ms.id)}
                      onMoveUp={() => moveMilestone(i, 'up')}
                      onMoveDown={() => moveMilestone(i, 'down')}
                      isFirst={i === 0}
                      isLast={i === project.milestones.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Milestones</p>
              )}
              {showNewMilestone && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                      <Input
                        placeholder="z.B. Keyword-Recherche abschließen"
                        value={newMilestone.name}
                        onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && newMilestone.name.trim() && createMilestoneMutation.mutate(newMilestone)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Fällig am</label>
                      <Input
                        type="date"
                        value={newMilestone.due_date}
                        onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                        className="w-40"
                      />
                    </div>
                    <div className="flex gap-1 items-end">
                      <Button size="sm" onClick={() => newMilestone.name.trim() && createMilestoneMutation.mutate(newMilestone)} disabled={!newMilestone.name.trim()}>
                        Anlegen
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowNewMilestone(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* KPIs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> KPIs
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowNewKPI(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> KPI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.kpis.length > 0 ? (
                <div className="space-y-2">
                  {project.kpis.map((kpi, i) => (
                    <div key={kpi.id} className="flex items-center gap-3 p-3 rounded-md border">
                      {editingKPI === kpi.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input value={kpiForm.label} onChange={e => setKpiForm({ ...kpiForm, label: e.target.value })} placeholder="Label" className="flex-1" />
                          <Input value={kpiForm.value} onChange={e => setKpiForm({ ...kpiForm, value: e.target.value })} placeholder="Wert" className="w-24" />
                          <Input value={kpiForm.unit} onChange={e => setKpiForm({ ...kpiForm, unit: e.target.value })} placeholder="Einheit" className="w-20" />
                          <Button size="sm" onClick={() => updateKPIMutation.mutate({ id: kpi.id, data: kpiForm })} title="Speichern">
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingKPI(null)} title="Abbrechen">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{kpi.label}</p>
                          </div>
                          <p className="text-sm font-mono font-semibold">
                            {kpi.value} {kpi.unit}
                          </p>
                          <button
                            onClick={() => loadKpiHistory(kpi.id)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Verlauf anzeigen"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingKPI(kpi.id); setKpiForm({ label: kpi.label, value: kpi.value, unit: kpi.unit }) }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Bearbeiten"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveKPI(i, 'up')} disabled={i === 0} className={cn('text-muted-foreground', i === 0 ? 'opacity-20' : 'hover:text-foreground')} title="Nach oben">
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => moveKPI(i, 'down')} disabled={i === project.kpis.length - 1} className={cn('text-muted-foreground', i === project.kpis.length - 1 ? 'opacity-20' : 'hover:text-foreground')} title="Nach unten">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button onClick={() => setConfirmDeleteKpi(kpi.id)} className="text-muted-foreground hover:text-destructive" title="Löschen">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Keine KPIs</p>
              )}
              {showNewKPI && (
                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bezeichnung</label>
                    <Input placeholder="z.B. Sichtbarkeitsindex" value={newKPI.label} onChange={e => setNewKPI({ ...newKPI, label: e.target.value })} autoFocus />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Wert</label>
                    <Input placeholder="42" value={newKPI.value} onChange={e => setNewKPI({ ...newKPI, value: e.target.value })} />
                  </div>
                  <div className="w-20">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Einheit</label>
                    <Input placeholder="%" value={newKPI.unit} onChange={e => setNewKPI({ ...newKPI, unit: e.target.value })} />
                  </div>
                  <div className="flex gap-1 items-end">
                    <Button size="sm" onClick={() => newKPI.label.trim() && createKPIMutation.mutate(newKPI)} disabled={!newKPI.label.trim()}>
                      Anlegen
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewKPI(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jour Fixe Notes */}
          {project.jourfix_notes && project.jourfix_notes.length > 0 && (() => {
            const allNotes = project.jourfix_notes
            const visibleNotes = showAllNotes ? allNotes : allNotes.slice(0, 3)
            const hiddenCount = allNotes.length - 3
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Jour Fixe Notizen
                    <span className="text-sm font-normal text-muted-foreground">({allNotes.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visibleNotes.map((jn: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(jn.completed_at)} — {jn.employee_name}
                        </p>
                        <p className="text-sm whitespace-pre-line mt-0.5">{jn.notes}</p>
                        {jn.tags && jn.tags.trim() !== '' && (
                          <div className="mt-1">
                            <TagPills tags={jn.tags} compact />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllNotes(!showAllNotes)}
                      className="text-xs text-primary hover:underline mt-3 w-full text-center cursor-pointer"
                    >
                      {showAllNotes ? 'Weniger anzeigen' : `${hiddenCount} ältere Notiz${hiddenCount !== 1 ? 'en' : ''} anzeigen`}
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Agreements */}
          {project.agreements && project.agreements.length > 0 && (() => {
            const open = project.agreements.filter((a: any) => a.status === 'offen')
            const done = project.agreements.filter((a: any) => a.status === 'erledigt')
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Handshake className="h-4 w-4" /> Vereinbarungen
                    {open.length > 0 && <Badge variant="secondary" className="text-xs">{open.length} offen</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {open.length > 0 ? (
                    <div className="space-y-2">
                      {open.map((a: any) => {
                        const overdue = a.due_date && a.due_date !== '' && isOverdue(a.due_date)
                        return (
                          <div key={a.id} className={cn(
                            'flex items-start gap-3 p-3 rounded-md border',
                            overdue && 'border-destructive/50 bg-destructive/5'
                          )}>
                            <button
                              onClick={() => toggleAgreementMutation.mutate(a.id)}
                              className="flex-shrink-0 cursor-pointer"
                              title="Als erledigt markieren"
                            >
                              <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{a.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{a.employee_name}</span>
                                {a.due_date && (
                                  <span className={cn('text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                                    {overdue && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                                    Fällig: {formatDate(a.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Keine offenen Vereinbarungen</p>
                  )}
                  {done.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowDoneAgreements(!showDoneAgreements)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto cursor-pointer"
                      >
                        {showDoneAgreements ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {done.length} erledigte Vereinbarung{done.length !== 1 ? 'en' : ''} {showDoneAgreements ? 'ausblenden' : 'anzeigen'}
                      </button>
                      {showDoneAgreements && (
                        <div className="space-y-2 mt-2">
                          {done.map((a: any) => (
                            <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-muted/50 bg-muted/10">
                              <button
                                onClick={() => toggleAgreementMutation.mutate(a.id)}
                                className="flex-shrink-0 cursor-pointer"
                                title="Als offen markieren"
                              >
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground line-through">{a.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">{a.employee_name}</span>
                                  {a.completed_at && (
                                    <span className="text-xs text-muted-foreground">
                                      Erledigt: {formatDate(a.completed_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>

        {/* Sidebar: Members + History */}
        <div className="space-y-6">
          {/* Members */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team
                </CardTitle>
                {availableEmployees.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowAddMember(true)} title="Mitarbeiter zuweisen">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {project.members.length > 0 ? (
                <div className="space-y-2">
                  {project.members.map(m => (
                    <div key={m.id} className="flex items-center gap-2 group">
                      <Avatar src={m.photo_path} name={m.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/employees/${m.id}`} className="text-sm font-medium hover:underline truncate block">{m.name}</Link>
                        {editingRole === m.id ? (
                          <form
                            onSubmit={e => {
                              e.preventDefault()
                              updateMemberRoleMutation.mutate({ employeeId: m.id, role: roleForm.trim() })
                            }}
                            className="flex items-center gap-1 mt-0.5"
                          >
                            <input
                              autoFocus
                              value={roleForm}
                              onChange={e => setRoleForm(e.target.value)}
                              onBlur={() => {
                                const trimmed = roleForm.trim()
                                if (trimmed !== (m.role_in_project || '')) {
                                  updateMemberRoleMutation.mutate({ employeeId: m.id, role: trimmed })
                                } else {
                                  setEditingRole(null)
                                }
                              }}
                              onKeyDown={e => { if (e.key === 'Escape') setEditingRole(null) }}
                              placeholder="z.B. Lead, Content..."
                              className="text-xs border rounded px-1.5 py-0.5 w-full bg-background"
                            />
                          </form>
                        ) : (
                          <button
                            onClick={() => { setEditingRole(m.id); setRoleForm(m.role_in_project || '') }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                            title="Projektrolle bearbeiten"
                          >
                            {m.role_in_project || <span className="opacity-0 group-hover:opacity-100 italic">+ Rolle</span>}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => removeMemberMutation.mutate(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        title="Aus Team entfernen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Kein Team zugewiesen</p>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Verlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} className="text-sm border-l-2 border-muted pl-3">
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)}</p>
                      <p>
                        <span className="font-medium">{h.field}</span>:{' '}
                        <span className="text-muted-foreground line-through">{h.old_value}</span>{' '}
                        → {h.new_value}
                      </p>
                    </div>
                  ))}
                </div>
                {history.length > 3 && (
                  <Link to={`/projects/${projectId}/history`} className="block text-sm text-primary hover:underline mt-3 text-center">
                    Alle {history.length} Einträge anzeigen
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onClose={() => { setShowAddMember(false); setAddMemberStep('select'); setAddMemberSelected(null); setAddMemberRole('') }}>
        <DialogHeader>
          <DialogTitle>{addMemberStep === 'select' ? 'Mitarbeiter zuweisen' : 'Projektrolle vergeben'}</DialogTitle>
        </DialogHeader>
        {addMemberStep === 'select' ? (
          <div className="space-y-2">
            {availableEmployees.map(emp => (
              <button
                key={emp.id}
                onClick={() => { setAddMemberSelected(emp); setAddMemberStep('role') }}
                className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-left"
              >
                <Avatar src={emp.photo_path} name={emp.name} size="sm" />
                <div>
                  <p className="text-sm font-medium">{emp.name}</p>
                  {emp.role && <p className="text-xs text-muted-foreground">{emp.role}</p>}
                </div>
              </button>
            ))}
            {availableEmployees.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Alle Mitarbeiter sind bereits zugewiesen</p>
            )}
          </div>
        ) : addMemberSelected && (
          <form
            onSubmit={e => {
              e.preventDefault()
              addMemberMutation.mutate({ employeeId: addMemberSelected.id, role: addMemberRole.trim() })
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-md">
              <Avatar src={addMemberSelected.photo_path} name={addMemberSelected.name} size="sm" />
              <div>
                <p className="text-sm font-medium">{addMemberSelected.name}</p>
                {addMemberSelected.role && <p className="text-xs text-muted-foreground">{addMemberSelected.role}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Rolle im Projekt</label>
              <Input
                autoFocus
                value={addMemberRole}
                onChange={e => setAddMemberRole(e.target.value)}
                placeholder="z.B. Lead, Content, QA..."
              />
              <p className="text-xs text-muted-foreground mt-1">Optional — kann auch spaeter gesetzt werden</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setAddMemberStep('select'); setAddMemberRole('') }}>
                Zurueck
              </Button>
              <Button type="submit">
                Zuweisen
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* KPI History Dialog */}
      <Dialog open={showKpiHistory !== null} onClose={() => setShowKpiHistory(null)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> KPI-Verlauf
          </DialogTitle>
        </DialogHeader>
        {kpiHistory.length > 0 ? (
          <div className="space-y-2">
            {kpiHistory.map(h => (
              <div key={h.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                <p className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)}</p>
                <p>
                  <span className="text-muted-foreground line-through">{h.old_value} {h.old_unit}</span>
                  {' → '}
                  <span className="font-medium">{h.new_value} {h.new_unit}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Noch keine Änderungen.</p>
        )}
      </Dialog>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmDeleteProject}
        onConfirm={() => { setConfirmDeleteProject(false); deleteMutation.mutate() }}
        onCancel={() => setConfirmDeleteProject(false)}
        title="Projekt löschen"
        message={`"${project.name}" und alle zugehörigen Milestones, KPIs und Notizen werden unwiderruflich gelöscht.`}
        confirmLabel="Endgültig löschen"
        variant="danger"
      />
      <ConfirmDialog
        open={confirmDeleteMs !== null}
        onConfirm={() => { if (confirmDeleteMs) deleteMilestoneMutation.mutate(confirmDeleteMs) }}
        onCancel={() => setConfirmDeleteMs(null)}
        title="Milestone löschen"
        message="Dieser Milestone wird unwiderruflich gelöscht."
        confirmLabel="Löschen"
        variant="danger"
      />
      <ConfirmDialog
        open={confirmDeleteKpi !== null}
        onConfirm={() => { if (confirmDeleteKpi) deleteKPIMutation.mutate(confirmDeleteKpi) }}
        onCancel={() => setConfirmDeleteKpi(null)}
        title="KPI löschen"
        message="Dieser KPI und sein Verlauf werden unwiderruflich gelöscht."
        confirmLabel="Löschen"
        variant="danger"
      />
    </div>
  )
}
