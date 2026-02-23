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
import { formatDate, goalStatusColor, goalStatusLabel, goalCategoryColor, goalCategoryLabel, cn } from '@/lib/utils'
import { Target, Plus, Trash2, Edit2, Save, X, ChevronDown, Ban, Circle, CircleDot, CheckCircle2, XCircle } from 'lucide-react'
import type { Goal } from '@/types'

interface GoalsCardProps {
  employeeId: number
}

export function GoalsCard({ employeeId }: GoalsCardProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('fachlich')
  const [dueDate, setDueDate] = useState('')
  const [period, setPeriod] = useState(String(new Date().getFullYear()))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', due_date: '', period: '' })
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [collapsedPeriods, setCollapsedPeriods] = useState<Record<string, boolean>>({})

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals', employeeId],
    queryFn: () => api.getGoals(employeeId),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createGoal(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', employeeId] })
      setTitle('')
      setDescription('')
      setCategory('fachlich')
      setDueDate('')
      setShowForm(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.toggleGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', employeeId] }),
  })

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.setGoalStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', employeeId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', employeeId] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', employeeId] })
      setConfirmDelete(null)
    },
  })

  // Group by period
  const periods = [...new Set(goals.map(g => g.period))].sort().reverse()

  const statusIcon = (status: string) => {
    switch (status) {
      case 'offen': return <Circle className="h-4 w-4 text-muted-foreground" />
      case 'in_arbeit': return <CircleDot className="h-4 w-4 text-blue-500" />
      case 'erreicht': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'nicht_erreicht': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" /> Zielvereinbarungen
            {goals.filter(g => g.status === 'in_arbeit').length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {goals.filter(g => g.status === 'in_arbeit').length} aktiv
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ziel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create Form */}
        {showForm && (
          <div className="p-3 rounded-md border border-dashed mb-4 space-y-2">
            <Input
              placeholder="Ziel-Titel"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Beschreibung (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Select
                value={category}
                onChange={e => setCategory(e.target.value)}
                options={[
                  { value: 'fachlich', label: 'Fachlich' },
                  { value: 'persoenlich', label: 'Persönlich' },
                  { value: 'fuehrung', label: 'Führung' },
                ]}
                className="w-36"
              />
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-40" />
              <Input
                placeholder="Zeitraum"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-24"
              />
              <Button
                size="sm"
                onClick={() => createMutation.mutate({
                  title: title.trim(),
                  description: description.trim(),
                  category,
                  due_date: dueDate || undefined,
                  period,
                })}
                disabled={!title.trim()}
              >
                Anlegen
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {/* Goals grouped by period */}
        {periods.length > 0 ? (
          <div className="space-y-4">
            {periods.map(p => {
              const periodGoals = goals.filter(g => g.period === p)
              const isCollapsed = collapsedPeriods[p]
              const activeCount = periodGoals.filter(g => g.status === 'offen' || g.status === 'in_arbeit').length

              return (
                <div key={p}>
                  <button
                    onClick={() => setCollapsedPeriods(prev => ({ ...prev, [p]: !prev[p] }))}
                    className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && '-rotate-90')} />
                    {p}
                    <span className="font-normal text-xs">
                      ({periodGoals.length} Ziele{activeCount > 0 ? `, ${activeCount} offen` : ''})
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2 ml-5">
                      {periodGoals.map(goal => {
                        if (editingId === goal.id) {
                          return (
                            <div key={goal.id} className="p-3 rounded-md border space-y-2">
                              <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                              <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                              <div className="flex gap-2">
                                <Select
                                  value={editForm.category}
                                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                  options={[
                                    { value: 'fachlich', label: 'Fachlich' },
                                    { value: 'persoenlich', label: 'Persönlich' },
                                    { value: 'fuehrung', label: 'Führung' },
                                  ]}
                                  className="w-36"
                                />
                                <Input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} className="w-40" />
                                <Input value={editForm.period} onChange={e => setEditForm({ ...editForm, period: e.target.value })} className="w-24" />
                                <Button size="sm" onClick={() => updateMutation.mutate({ id: goal.id, data: editForm })} disabled={!editForm.title.trim()}>
                                  <Save className="h-3.5 w-3.5 mr-1" />Speichern
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Abbrechen</Button>
                              </div>
                            </div>
                          )
                        }

                        const isDone = goal.status === 'erreicht' || goal.status === 'nicht_erreicht'
                        return (
                          <div key={goal.id} className={cn(
                            'flex items-start gap-3 p-3 rounded-md border group',
                            isDone && 'opacity-60'
                          )}>
                            <button
                              onClick={() => toggleMutation.mutate(goal.id)}
                              className="mt-0.5 flex-shrink-0"
                              title="Status wechseln: Offen → In Arbeit → Erreicht → Offen"
                            >
                              {statusIcon(goal.status)}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium', isDone && 'line-through')}>{goal.title}</p>
                              {goal.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn(goalCategoryColor(goal.category), 'text-xs')}>
                                  {goalCategoryLabel(goal.category)}
                                </Badge>
                                <Badge className={cn(goalStatusColor(goal.status), 'text-xs')}>
                                  {goalStatusLabel(goal.status)}
                                </Badge>
                                {goal.due_date && (
                                  <span className="text-xs text-muted-foreground">
                                    Fällig: {formatDate(goal.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                              {goal.status !== 'nicht_erreicht' && (
                                <button
                                  onClick={() => setStatusMutation.mutate({ id: goal.id, status: 'nicht_erreicht' })}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Als nicht erreicht markieren"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingId(goal.id)
                                  setEditForm({
                                    title: goal.title,
                                    description: goal.description,
                                    category: goal.category,
                                    due_date: goal.due_date || '',
                                    period: goal.period,
                                  })
                                }}
                                className="text-muted-foreground hover:text-foreground"
                                title="Bearbeiten"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(goal.id)}
                                className="text-muted-foreground hover:text-destructive"
                                title="Löschen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : !showForm && (
          <EmptyState
            icon={Target}
            title="Keine Ziele definiert"
            description="Persönliche Entwicklungsziele für den Mitarbeiter definieren."
          />
        )}

        <ConfirmDialog
          open={confirmDelete !== null}
          onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete) }}
          onCancel={() => setConfirmDelete(null)}
          title="Ziel löschen"
          message="Dieses Ziel wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
      </CardContent>
    </Card>
  )
}
