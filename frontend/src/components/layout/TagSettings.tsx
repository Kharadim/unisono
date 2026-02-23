import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TAG_COLORS, cn } from '@/lib/utils'
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import type { TagDefinition } from '@/types'

const COLOR_OPTIONS = Object.keys(TAG_COLORS) as string[]

interface TagSettingsProps {
  open: boolean
  onClose: () => void
}

export function TagSettings({ open, onClose }: TagSettingsProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('blue')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data: tags = [] } = useQuery<TagDefinition[]>({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setNewName('')
      setNewColor('blue')
      setShowAddForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setConfirmDelete(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => api.reorderTags(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })

  const moveTag = (index: number, direction: 'up' | 'down') => {
    const ids = tags.map(t => t.id)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
    reorderMutation.mutate(ids)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Tag-Verwaltung</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tags können auf Notizen gesetzt werden, um sie zu kategorisieren und filtern.
          </p>

          {/* Tag List */}
          <div className="space-y-1.5">
            {tags.map((tag, idx) => {
              const colors = TAG_COLORS[tag.color] || TAG_COLORS.blue
              if (editingId === tag.id) {
                return (
                  <div key={tag.id} className="flex items-center gap-2 p-2 rounded-md border">
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={cn(
                            'h-5 w-5 rounded-full border-2',
                            TAG_COLORS[c].dot,
                            editColor === c ? 'border-foreground' : 'border-transparent'
                          )}
                          title={c}
                        />
                      ))}
                    </div>
                    <Button size="sm" className="h-7" onClick={() => updateMutation.mutate({ id: tag.id, data: { name: editName, color: editColor } })} disabled={!editName.trim()}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              }
              return (
                <div key={tag.id} className="flex items-center gap-2 p-2 rounded-md border group">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs', colors.bg, colors.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                    {tag.name}
                  </span>
                  <span className="flex-1" />
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={() => moveTag(idx, 'up')} className="text-muted-foreground hover:text-foreground p-0.5" title="Nach oben" disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveTag(idx, 'down')} className="text-muted-foreground hover:text-foreground p-0.5" title="Nach unten" disabled={idx === tags.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color) }} className="text-muted-foreground hover:text-foreground p-0.5" title="Bearbeiten">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(tag.id)} className="text-muted-foreground hover:text-destructive p-0.5" title="Löschen">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Form */}
          {showAddForm ? (
            <div className="flex items-center gap-2 p-2 rounded-md border border-dashed">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Tag-Name"
                className="flex-1 h-8 text-sm"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate({ name: newName.trim(), color: newColor })}
              />
              <div className="flex gap-1">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      'h-5 w-5 rounded-full border-2',
                      TAG_COLORS[c].dot,
                      newColor === c ? 'border-foreground' : 'border-transparent'
                    )}
                    title={c}
                  />
                ))}
              </div>
              <Button size="sm" className="h-7" onClick={() => createMutation.mutate({ name: newName.trim(), color: newColor })} disabled={!newName.trim()}>
                <Save className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowAddForm(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Tag hinzufügen
            </Button>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Schließen</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete !== null}
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete) }}
        onCancel={() => setConfirmDelete(null)}
        title="Tag löschen"
        message="Dieser Tag wird von allen Notizen entfernt und unwiderruflich gelöscht."
        confirmLabel="Löschen"
        variant="danger"
      />
    </>
  )
}
