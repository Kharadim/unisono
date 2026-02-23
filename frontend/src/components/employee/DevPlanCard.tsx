import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  formatDate, isOverdue, cn,
  devPriorityColor, devPriorityLabel,
  measureStatusColor, measureStatusLabel,
  performanceRatingLabel, performanceRatingColor,
} from '@/lib/utils'
import {
  Sparkles, Plus, Trash2, Edit2, Save, X, ChevronDown,
  Star, TrendingUp, CheckCircle2, Circle, Loader2,
} from 'lucide-react'
import type { DevPlan, DevArea, DevStrength, DevMeasure } from '@/types'
import { StepsReflexionSection } from './devplan/StepsReflexionSection'
import { StepsBewertungSection } from './devplan/StepsBewertungSection'
import { StepsWeiterbildungSection } from './devplan/StepsWeiterbildungSection'

interface DevPlanCardProps {
  employeeId: number
}

export function DevPlanCard({ employeeId }: DevPlanCardProps) {
  const queryClient = useQueryClient()
  const queryKey = ['devplan', employeeId]

  // Plan creation
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanPeriod, setNewPlanPeriod] = useState(String(new Date().getFullYear()))

  // Remarks (was summary/Gesamtbewertung)
  const [editingRemarks, setEditingRemarks] = useState<number | null>(null)
  const [remarksText, setRemarksText] = useState('')

  // Strength inline
  const [addingStrengthFor, setAddingStrengthFor] = useState<number | null>(null)
  const [newStrengthText, setNewStrengthText] = useState('')
  const [editingStrengthId, setEditingStrengthId] = useState<number | null>(null)
  const [editStrengthText, setEditStrengthText] = useState('')

  // Area inline
  const [addingAreaFor, setAddingAreaFor] = useState<number | null>(null)
  const [newAreaTitle, setNewAreaTitle] = useState('')
  const [newAreaPriority, setNewAreaPriority] = useState('mittel')
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null)
  const [editAreaForm, setEditAreaForm] = useState({ title: '', description: '', priority: 'mittel' })

  // Measure inline
  const [addingMeasureFor, setAddingMeasureFor] = useState<number | null>(null)
  const [newMeasureContent, setNewMeasureContent] = useState('')
  const [newMeasureDue, setNewMeasureDue] = useState('')
  const [editingMeasureId, setEditingMeasureId] = useState<number | null>(null)
  const [editMeasureForm, setEditMeasureForm] = useState({ content: '', due_date: '' })

  // Collapsed older plans
  const [collapsedPlans, setCollapsedPlans] = useState<Record<number, boolean>>({})
  // Collapsed areas
  const [collapsedAreas, setCollapsedAreas] = useState<Record<number, boolean>>({})

  // Confirm deletes
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<number | null>(null)
  const [confirmDeleteStrength, setConfirmDeleteStrength] = useState<number | null>(null)
  const [confirmDeleteArea, setConfirmDeleteArea] = useState<number | null>(null)
  const [confirmDeleteMeasure, setConfirmDeleteMeasure] = useState<number | null>(null)

  const { data: plans = [] } = useQuery<DevPlan[]>({
    queryKey,
    queryFn: () => api.getDevPlans(employeeId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  // --- Mutations ---
  const createPlanMut = useMutation({
    mutationFn: (data: any) => api.createDevPlan(employeeId, data),
    onSuccess: () => { invalidate(); setShowNewPlan(false); setNewPlanPeriod(String(new Date().getFullYear())) },
  })
  const updatePlanMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDevPlan(id, data),
    onSuccess: () => { invalidate(); setEditingRemarks(null) },
  })
  const deletePlanMut = useMutation({
    mutationFn: (id: number) => api.deleteDevPlan(id),
    onSuccess: () => { invalidate(); setConfirmDeletePlan(null) },
  })

  const createStrengthMut = useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: any }) => api.createDevStrength(planId, data),
    onSuccess: () => { invalidate(); setNewStrengthText(''); setAddingStrengthFor(null) },
  })
  const updateStrengthMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDevStrength(id, data),
    onSuccess: () => { invalidate(); setEditingStrengthId(null) },
  })
  const deleteStrengthMut = useMutation({
    mutationFn: (id: number) => api.deleteDevStrength(id),
    onSuccess: () => { invalidate(); setConfirmDeleteStrength(null) },
  })

  const createAreaMut = useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: any }) => api.createDevArea(planId, data),
    onSuccess: () => { invalidate(); setNewAreaTitle(''); setNewAreaPriority('mittel'); setAddingAreaFor(null) },
  })
  const updateAreaMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDevArea(id, data),
    onSuccess: () => { invalidate(); setEditingAreaId(null) },
  })
  const deleteAreaMut = useMutation({
    mutationFn: (id: number) => api.deleteDevArea(id),
    onSuccess: () => { invalidate(); setConfirmDeleteArea(null) },
  })

  const createMeasureMut = useMutation({
    mutationFn: ({ areaId, data }: { areaId: number; data: any }) => api.createDevMeasure(areaId, data),
    onSuccess: () => { invalidate(); setNewMeasureContent(''); setNewMeasureDue(''); setAddingMeasureFor(null) },
  })
  const updateMeasureMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDevMeasure(id, data),
    onSuccess: () => { invalidate(); setEditingMeasureId(null) },
  })
  const deleteMeasureMut = useMutation({
    mutationFn: (id: number) => api.deleteDevMeasure(id),
    onSuccess: () => { invalidate(); setConfirmDeleteMeasure(null) },
  })
  const toggleMeasureMut = useMutation({
    mutationFn: (id: number) => api.toggleDevMeasure(id),
    onSuccess: () => invalidate(),
  })

  const measureIcon = (status: string) => {
    switch (status) {
      case 'offen': return <Circle className="h-4 w-4 text-muted-foreground" />
      case 'in_arbeit': return <Loader2 className="h-4 w-4 text-amber-500" />
      case 'erledigt': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default: return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Entwicklungsplan
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowNewPlan(!showNewPlan)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Neuer Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* New Plan Form */}
        {showNewPlan && (
          <div className="p-3 rounded-md border border-dashed mb-4 space-y-2">
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs font-medium mb-1 block">Zeitraum</label>
                <Input
                  placeholder="z.B. 2026"
                  value={newPlanPeriod}
                  onChange={e => setNewPlanPeriod(e.target.value)}
                  className="w-32"
                  autoFocus
                />
              </div>
              <Button
                size="sm"
                onClick={() => createPlanMut.mutate({ period: newPlanPeriod.trim() })}
                disabled={!newPlanPeriod.trim()}
              >
                Anlegen
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewPlan(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {/* Plans */}
        {plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan, planIdx) => {
              const isOlderPlan = planIdx > 0
              const isCollapsed = isOlderPlan && collapsedPlans[plan.id] !== false

              return (
                <div key={plan.id}>
                  {/* Plan Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {isOlderPlan && (
                      <button
                        onClick={() => setCollapsedPlans(prev => ({ ...prev, [plan.id]: !isCollapsed }))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && '-rotate-90')} />
                      </button>
                    )}
                    <h3 className="text-sm font-semibold">
                      STEPs — Entwicklungsplan {plan.period}
                    </h3>
                    {plan.performance_rating && (
                      <Badge className={cn(performanceRatingColor(plan.performance_rating), 'text-xs')}>
                        {performanceRatingLabel(plan.performance_rating)}
                      </Badge>
                    )}
                    {isOlderPlan && isCollapsed && (
                      <span className="text-xs text-muted-foreground">
                        ({plan.strengths.length} Stärken, {plan.areas.length} Felder)
                      </span>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => setConfirmDeletePlan(plan.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Plan löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {(!isOlderPlan || !isCollapsed) && (
                    <div className="space-y-4 ml-1">
                      {/* Reflexion Section */}
                      <StepsReflexionSection plan={plan} employeeId={employeeId} />

                      {/* Strengths */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Stärken</span>
                          <button
                            onClick={() => { setAddingStrengthFor(plan.id); setNewStrengthText('') }}
                            className="text-muted-foreground hover:text-foreground ml-auto"
                            title="Stärke hinzufügen"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1.5 ml-6">
                          {plan.strengths.map(s => (
                            <div key={s.id} className="flex items-start gap-2 group">
                              {editingStrengthId === s.id ? (
                                <div className="flex-1 flex gap-1">
                                  <Input
                                    value={editStrengthText}
                                    onChange={e => setEditStrengthText(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && editStrengthText.trim()) updateStrengthMut.mutate({ id: s.id, data: { content: editStrengthText.trim() } })
                                      if (e.key === 'Escape') setEditingStrengthId(null)
                                    }}
                                    className="h-7 text-sm"
                                    autoFocus
                                  />
                                  <Button size="sm" className="h-7" onClick={() => updateStrengthMut.mutate({ id: s.id, data: { content: editStrengthText.trim() } })} disabled={!editStrengthText.trim()}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingStrengthId(null)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-green-600 mt-0.5">+</span>
                                  <span className="text-sm flex-1">{s.content}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => { setEditingStrengthId(s.id); setEditStrengthText(s.content) }}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Bearbeiten"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteStrength(s.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                      title="Löschen"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          {addingStrengthFor === plan.id && (
                            <div className="flex gap-1">
                              <Input
                                placeholder="z.B. Starke analytische Fähigkeiten"
                                value={newStrengthText}
                                onChange={e => setNewStrengthText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && newStrengthText.trim()) createStrengthMut.mutate({ planId: plan.id, data: { content: newStrengthText.trim() } })
                                  if (e.key === 'Escape') setAddingStrengthFor(null)
                                }}
                                className="h-7 text-sm flex-1"
                                autoFocus
                              />
                              <Button size="sm" className="h-7" onClick={() => createStrengthMut.mutate({ planId: plan.id, data: { content: newStrengthText.trim() } })} disabled={!newStrengthText.trim()}>
                                Hinzufügen
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => setAddingStrengthFor(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {plan.strengths.length === 0 && addingStrengthFor !== plan.id && (
                            <button
                              onClick={() => { setAddingStrengthFor(plan.id); setNewStrengthText('') }}
                              className="text-xs text-muted-foreground hover:text-foreground border border-dashed rounded-md px-3 py-2 w-full text-left"
                            >
                              + Stärke hinzufügen
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Development Areas */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700">Entwicklungsfelder</span>
                          <button
                            onClick={() => { setAddingAreaFor(plan.id); setNewAreaTitle(''); setNewAreaPriority('mittel') }}
                            className="text-muted-foreground hover:text-foreground ml-auto"
                            title="Entwicklungsfeld hinzufügen"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3 ml-6">
                          {plan.areas.map(area => {
                            const areaCollapsed = collapsedAreas[area.id] ?? false

                            if (editingAreaId === area.id) {
                              return (
                                <div key={area.id} className="p-3 rounded-md border space-y-2">
                                  <Input
                                    value={editAreaForm.title}
                                    onChange={e => setEditAreaForm({ ...editAreaForm, title: e.target.value })}
                                    placeholder="Titel"
                                    autoFocus
                                  />
                                  <Textarea
                                    value={editAreaForm.description}
                                    onChange={e => setEditAreaForm({ ...editAreaForm, description: e.target.value })}
                                    placeholder="Beschreibung (optional)"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Select
                                      value={editAreaForm.priority}
                                      onChange={e => setEditAreaForm({ ...editAreaForm, priority: e.target.value })}
                                      options={[
                                        { value: 'hoch', label: 'Hoch' },
                                        { value: 'mittel', label: 'Mittel' },
                                        { value: 'niedrig', label: 'Niedrig' },
                                      ]}
                                      className="w-28"
                                    />
                                    <Button size="sm" onClick={() => updateAreaMut.mutate({ id: area.id, data: editAreaForm })} disabled={!editAreaForm.title.trim()}>
                                      <Save className="h-3 w-3 mr-1" /> Speichern
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingAreaId(null)}>Abbrechen</Button>
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <div key={area.id} className="rounded-md border">
                                {/* Area Header */}
                                <div className="flex items-center gap-2 p-3 group">
                                  <button
                                    onClick={() => setCollapsedAreas(prev => ({ ...prev, [area.id]: !areaCollapsed }))}
                                  >
                                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', areaCollapsed && '-rotate-90')} />
                                  </button>
                                  <span className="text-sm font-medium flex-1">{area.title}</span>
                                  <Badge className={cn(devPriorityColor(area.priority), 'text-xs')}>
                                    {devPriorityLabel(area.priority)}
                                  </Badge>
                                  {area.measures.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {area.measures.filter(m => m.status === 'erledigt').length}/{area.measures.length}
                                    </span>
                                  )}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => {
                                        setEditingAreaId(area.id)
                                        setEditAreaForm({ title: area.title, description: area.description, priority: area.priority })
                                      }}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Bearbeiten"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteArea(area.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                      title="Löschen"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Area Content */}
                                {!areaCollapsed && (
                                  <div className="px-3 pb-3 border-t">
                                    {area.description && (
                                      <p className="text-xs text-muted-foreground mt-2 mb-2">{area.description}</p>
                                    )}

                                    {/* Measures */}
                                    <div className="space-y-1.5 mt-2">
                                      {area.measures.map(measure => {
                                        const overdue = measure.status !== 'erledigt' && isOverdue(measure.due_date)

                                        if (editingMeasureId === measure.id) {
                                          return (
                                            <div key={measure.id} className="flex gap-1 items-end">
                                              <Input
                                                value={editMeasureForm.content}
                                                onChange={e => setEditMeasureForm({ ...editMeasureForm, content: e.target.value })}
                                                className="h-7 text-sm flex-1"
                                                autoFocus
                                              />
                                              <Input
                                                type="date"
                                                value={editMeasureForm.due_date}
                                                onChange={e => setEditMeasureForm({ ...editMeasureForm, due_date: e.target.value })}
                                                className="h-7 text-sm w-36"
                                              />
                                              <Button size="sm" className="h-7" onClick={() => updateMeasureMut.mutate({ id: measure.id, data: editMeasureForm })} disabled={!editMeasureForm.content.trim()}>
                                                <Save className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingMeasureId(null)}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )
                                        }

                                        return (
                                          <div
                                            key={measure.id}
                                            className={cn(
                                              'flex items-center gap-2 px-2 py-1.5 rounded group/measure',
                                              overdue && 'bg-destructive/5',
                                              measure.status === 'erledigt' && 'opacity-60'
                                            )}
                                          >
                                            <button
                                              onClick={() => toggleMeasureMut.mutate(measure.id)}
                                              title="Status wechseln: Offen → In Arbeit → Erledigt → Offen"
                                              className="flex-shrink-0"
                                            >
                                              {measureIcon(measure.status)}
                                            </button>
                                            <span className={cn(
                                              'text-sm flex-1',
                                              measure.status === 'erledigt' && 'line-through text-muted-foreground'
                                            )}>
                                              {measure.content}
                                            </span>
                                            {measure.due_date && (
                                              <span className={cn(
                                                'text-xs',
                                                overdue ? 'text-destructive' : 'text-muted-foreground'
                                              )}>
                                                {formatDate(measure.due_date)}
                                              </span>
                                            )}
                                            <div className="flex gap-1 opacity-0 group-hover/measure:opacity-100">
                                              <button
                                                onClick={() => {
                                                  setEditingMeasureId(measure.id)
                                                  setEditMeasureForm({ content: measure.content, due_date: measure.due_date || '' })
                                                }}
                                                className="text-muted-foreground hover:text-foreground"
                                                title="Bearbeiten"
                                              >
                                                <Edit2 className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => setConfirmDeleteMeasure(measure.id)}
                                                className="text-muted-foreground hover:text-destructive"
                                                title="Löschen"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })}

                                      {/* Add Measure */}
                                      {addingMeasureFor === area.id ? (
                                        <div className="flex gap-1 items-end mt-1">
                                          <Input
                                            placeholder="z.B. Scrum-Zertifizierung absolvieren"
                                            value={newMeasureContent}
                                            onChange={e => setNewMeasureContent(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter' && newMeasureContent.trim()) createMeasureMut.mutate({ areaId: area.id, data: { content: newMeasureContent.trim(), due_date: newMeasureDue || undefined } })
                                              if (e.key === 'Escape') setAddingMeasureFor(null)
                                            }}
                                            className="h-7 text-sm flex-1"
                                            autoFocus
                                          />
                                          <Input
                                            type="date"
                                            value={newMeasureDue}
                                            onChange={e => setNewMeasureDue(e.target.value)}
                                            className="h-7 text-sm w-36"
                                          />
                                          <Button size="sm" className="h-7" onClick={() => createMeasureMut.mutate({ areaId: area.id, data: { content: newMeasureContent.trim(), due_date: newMeasureDue || undefined } })} disabled={!newMeasureContent.trim()}>
                                            Hinzufügen
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setAddingMeasureFor(null)}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setAddingMeasureFor(area.id); setNewMeasureContent(''); setNewMeasureDue('') }}
                                          className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1"
                                        >
                                          <Plus className="h-3 w-3" /> Massnahme
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Add Area */}
                          {addingAreaFor === plan.id ? (
                            <div className="p-3 rounded-md border border-dashed space-y-2">
                              <Input
                                placeholder="z.B. Projektmanagement"
                                value={newAreaTitle}
                                onChange={e => setNewAreaTitle(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Select
                                  value={newAreaPriority}
                                  onChange={e => setNewAreaPriority(e.target.value)}
                                  options={[
                                    { value: 'hoch', label: 'Hoch' },
                                    { value: 'mittel', label: 'Mittel' },
                                    { value: 'niedrig', label: 'Niedrig' },
                                  ]}
                                  className="w-28"
                                />
                                <Button size="sm" onClick={() => createAreaMut.mutate({ planId: plan.id, data: { title: newAreaTitle.trim(), priority: newAreaPriority } })} disabled={!newAreaTitle.trim()}>
                                  Anlegen
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAddingAreaFor(null)}>Abbrechen</Button>
                              </div>
                            </div>
                          ) : plan.areas.length === 0 ? (
                            <button
                              onClick={() => { setAddingAreaFor(plan.id); setNewAreaTitle(''); setNewAreaPriority('mittel') }}
                              className="text-xs text-muted-foreground hover:text-foreground border border-dashed rounded-md px-3 py-2 w-full text-left"
                            >
                              + Entwicklungsfeld hinzufügen
                            </button>
                          ) : (
                            <button
                              onClick={() => { setAddingAreaFor(plan.id); setNewAreaTitle(''); setNewAreaPriority('mittel') }}
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Entwicklungsfeld
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bewertung Section */}
                      <StepsBewertungSection plan={plan} employeeId={employeeId} />

                      {/* Weiterbildung Section */}
                      <StepsWeiterbildungSection plan={plan} employeeId={employeeId} />

                      {/* Anmerkungen (was Gesamtbewertung) */}
                      <div>
                        <button
                          onClick={() => {
                            if (editingRemarks === plan.id) {
                              setEditingRemarks(null)
                            } else {
                              setEditingRemarks(plan.id)
                              setRemarksText(plan.remarks || plan.summary || '')
                            }
                          }}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
                        >
                          <ChevronDown className={cn('h-3 w-3 transition-transform', editingRemarks !== plan.id && '-rotate-90')} />
                          Anmerkungen
                          {(plan.remarks || plan.summary) && editingRemarks !== plan.id && (
                            <span className="text-muted-foreground/60 ml-1">— {(plan.remarks || plan.summary).slice(0, 60)}{(plan.remarks || plan.summary).length > 60 ? '...' : ''}</span>
                          )}
                        </button>
                        {editingRemarks === plan.id && (
                          <div className="space-y-2">
                            <Textarea
                              value={remarksText}
                              onChange={e => setRemarksText(e.target.value)}
                              placeholder="Allgemeine Anmerkungen zum Gespräch..."
                              rows={3}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => updatePlanMut.mutate({ id: plan.id, data: { remarks: remarksText, summary: remarksText } })}>
                                <Save className="h-3 w-3 mr-1" /> Speichern
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingRemarks(null)}>Abbrechen</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Separator between plans */}
                  {planIdx < plans.length - 1 && <div className="border-t mt-4" />}
                </div>
              )
            })}
          </div>
        ) : !showNewPlan && (
          <EmptyState
            icon={Sparkles}
            title="Kein Entwicklungsplan"
            description="Erstelle einen Entwicklungsplan mit Stärken, Entwicklungsfeldern und Massnahmen."
          />
        )}

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={confirmDeletePlan !== null}
          onConfirm={() => { if (confirmDeletePlan) deletePlanMut.mutate(confirmDeletePlan) }}
          onCancel={() => setConfirmDeletePlan(null)}
          title="Entwicklungsplan löschen"
          message="Der gesamte Plan mit allen Stärken, Entwicklungsfeldern und Massnahmen wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
        <ConfirmDialog
          open={confirmDeleteStrength !== null}
          onConfirm={() => { if (confirmDeleteStrength) deleteStrengthMut.mutate(confirmDeleteStrength) }}
          onCancel={() => setConfirmDeleteStrength(null)}
          title="Stärke löschen"
          message="Diese Stärke wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
        <ConfirmDialog
          open={confirmDeleteArea !== null}
          onConfirm={() => { if (confirmDeleteArea) deleteAreaMut.mutate(confirmDeleteArea) }}
          onCancel={() => setConfirmDeleteArea(null)}
          title="Entwicklungsfeld löschen"
          message="Dieses Entwicklungsfeld und alle zugehörigen Massnahmen werden unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
        <ConfirmDialog
          open={confirmDeleteMeasure !== null}
          onConfirm={() => { if (confirmDeleteMeasure) deleteMeasureMut.mutate(confirmDeleteMeasure) }}
          onCancel={() => setConfirmDeleteMeasure(null)}
          title="Massnahme löschen"
          message="Diese Massnahme wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
      </CardContent>
    </Card>
  )
}
