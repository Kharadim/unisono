import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn, trainingStatusLabel, trainingStatusColor, formatDate, isOverdue } from '@/lib/utils'
import { ChevronDown, GraduationCap, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import type { DevPlan, DevTraining } from '@/types'

interface StepsWeiterbildungSectionProps {
  plan: DevPlan
  employeeId: number
}

export function StepsWeiterbildungSection({ plan, employeeId }: StepsWeiterbildungSectionProps) {
  const queryClient = useQueryClient()
  const queryKey = ['devplan', employeeId]
  const [expanded, setExpanded] = useState((plan.trainings || []).length > 0)

  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newProvider, setNewProvider] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newDue, setNewDue] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ content: '', provider: '', cost: '', due_date: '' })

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const createMut = useMutation({
    mutationFn: (data: any) => api.createDevTraining(plan.id, data),
    onSuccess: () => { invalidate(); setAdding(false); setNewContent(''); setNewProvider(''); setNewCost(''); setNewDue('') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDevTraining(id, data),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteDevTraining(id),
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (id: number) => api.toggleDevTraining(id),
    onSuccess: () => invalidate(),
  })

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', !expanded && '-rotate-90')} />
        <GraduationCap className="h-4 w-4 text-indigo-600" />
        <span className="text-sm font-semibold text-indigo-700">Weiterbildung</span>
        {!expanded && plan.trainings.length > 0 && (
          <span className="text-xs text-muted-foreground/60 ml-1">
            ({plan.trainings.filter(t => t.status !== 'abgeschlossen').length} offen)
          </span>
        )}
      </button>

      {expanded && (
        <div className="ml-6 mt-3 space-y-2">
          {plan.trainings.map(training => {
            if (editingId === training.id) {
              return (
                <div key={training.id} className="p-3 rounded-md border space-y-2">
                  <Input
                    value={editForm.content}
                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                    placeholder="Weiterbildung"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Input
                      value={editForm.provider}
                      onChange={e => setEditForm({ ...editForm, provider: e.target.value })}
                      placeholder="Anbieter"
                      className="flex-1"
                    />
                    <Input
                      value={editForm.cost}
                      onChange={e => setEditForm({ ...editForm, cost: e.target.value })}
                      placeholder="Kosten"
                      className="w-28"
                    />
                    <Input
                      type="date"
                      value={editForm.due_date}
                      onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                      className="w-36"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => updateMut.mutate({ id: training.id, data: editForm })}
                      disabled={!editForm.content.trim()}
                    >
                      <Save className="h-3 w-3 mr-1" /> Speichern
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Abbrechen</Button>
                  </div>
                </div>
              )
            }

            const overdue = training.status !== 'abgeschlossen' && isOverdue(training.due_date)

            return (
              <div
                key={training.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md border group',
                  training.status === 'abgeschlossen' && 'opacity-60',
                  overdue && 'border-destructive/30 bg-destructive/5'
                )}
              >
                <button
                  onClick={() => toggleMut.mutate(training.id)}
                  title="Status wechseln: Vorgeschlagen → Genehmigt → Abgeschlossen"
                  className="flex-shrink-0"
                >
                  <Badge className={cn(trainingStatusColor(training.status), 'text-[10px] cursor-pointer')}>
                    {trainingStatusLabel(training.status)}
                  </Badge>
                </button>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm',
                    training.status === 'abgeschlossen' && 'line-through text-muted-foreground'
                  )}>
                    {training.content}
                  </span>
                  {(training.provider || training.cost) && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {[training.provider, training.cost].filter(Boolean).join(' — ')}
                    </span>
                  )}
                </div>
                {training.due_date && (
                  <span className={cn('text-xs', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                    {formatDate(training.due_date)}
                  </span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditingId(training.id)
                      setEditForm({
                        content: training.content,
                        provider: training.provider,
                        cost: training.cost,
                        due_date: training.due_date || '',
                      })
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    title="Bearbeiten"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(training.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Löschen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          {adding ? (
            <div className="p-3 rounded-md border border-dashed space-y-2">
              <Input
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="z.B. Scrum-Zertifizierung"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newContent.trim()) createMut.mutate({ content: newContent.trim(), provider: newProvider, cost: newCost, due_date: newDue || undefined })
                  if (e.key === 'Escape') setAdding(false)
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  placeholder="Anbieter"
                  className="flex-1"
                />
                <Input
                  value={newCost}
                  onChange={e => setNewCost(e.target.value)}
                  placeholder="Kosten"
                  className="w-28"
                />
                <Input
                  type="date"
                  value={newDue}
                  onChange={e => setNewDue(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => createMut.mutate({ content: newContent.trim(), provider: newProvider, cost: newCost, due_date: newDue || undefined })}
                  disabled={!newContent.trim()}
                >
                  Hinzufügen
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setAdding(true); setNewContent(''); setNewProvider(''); setNewCost(''); setNewDue('') }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Weiterbildung
            </button>
          )}

          <ConfirmDialog
            open={confirmDelete !== null}
            onConfirm={() => { if (confirmDelete) deleteMut.mutate(confirmDelete) }}
            onCancel={() => setConfirmDelete(null)}
            title="Weiterbildung löschen"
            message="Diese Weiterbildung wird unwiderruflich gelöscht."
            confirmLabel="Löschen"
            variant="danger"
          />
        </div>
      )}
    </div>
  )
}
