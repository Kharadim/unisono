import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TagSelector, TagPills } from '@/components/ui/tag-selector'
import { formatDate, cn } from '@/lib/utils'
import { StickyNote, Edit2, Trash2, Filter, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Note, TagDefinition } from '@/types'

interface NotesSectionProps {
  employeeId: number
}

export function NotesSection({ employeeId }: NotesSectionProps) {
  const queryClient = useQueryClient()
  const [noteText, setNoteText] = useState('')
  const [noteTags, setNoteTags] = useState<string[]>([])
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [editNoteTags, setEditNoteTags] = useState<string[]>([])
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<number | null>(null)
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({})

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', employeeId],
    queryFn: () => api.getNotes(employeeId),
  })

  const noteMutation = useMutation({
    mutationFn: (data: { content: string; tags: string }) =>
      api.createNote(employeeId, { content: data.content, type: 'general', tags: data.tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', employeeId] })
      setNoteText('')
      setNoteTags([])
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, content, tags }: { id: number; content: string; tags: string }) =>
      api.updateNote(id, { content, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', employeeId] })
      setEditingNoteId(null)
      setEditNoteText('')
      setEditNoteTags([])
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', employeeId] })
      setConfirmDeleteNote(null)
    },
  })

  // Filter notes by tags
  const filteredNotes = filterTags.length > 0
    ? notes.filter(note => {
        const noteTags = (note.tags || '').split(',').map(t => t.trim()).filter(Boolean)
        return filterTags.some(ft => noteTags.includes(ft))
      })
    : notes

  // Group filtered notes by month
  const groupedNotes: { key: string; label: string; notes: Note[] }[] = (() => {
    const groups = new Map<string, Note[]>()
    for (const note of filteredNotes) {
      const dateStr = note.created_at || note.date
      let monthKey: string
      try {
        monthKey = format(parseISO(dateStr), 'yyyy-MM')
      } catch {
        monthKey = 'unknown'
      }
      if (!groups.has(monthKey)) groups.set(monthKey, [])
      groups.get(monthKey)!.push(note)
    }

    // Sort keys descending (newest first)
    const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))

    return sorted.map(([key, notes]) => {
      let label: string
      try {
        const [year, month] = key.split('-').map(Number)
        label = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: de })
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1)
      } catch {
        label = key
      }
      return { key, label, notes }
    })
  })()

  // Current month key for default-open
  const currentMonthKey = format(new Date(), 'yyyy-MM')

  const toggleMonth = (key: string) => {
    setCollapsedMonths(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isMonthCollapsed = (key: string) => {
    // Default: current month open, others collapsed
    if (key in collapsedMonths) return collapsedMonths[key]
    return key !== currentMonthKey
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="h-5 w-5" /> Notizen zum Mitarbeiter
          </CardTitle>
          <Button
            size="sm"
            variant={showFilter ? 'secondary' : 'ghost'}
            onClick={() => setShowFilter(!showFilter)}
            title="Nach Tags filtern"
          >
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter
            {filterTags.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{filterTags.length}</Badge>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Dein persoenliches Gedaechtnis fuer diesen Mitarbeiter. Allgemeine Notizen aus Jour Fixes landen hier automatisch.
        </p>
      </CardHeader>
      <CardContent>
        {/* Tag Filter */}
        {showFilter && (
          <div className="mb-4 p-3 rounded-md bg-muted/30 border">
            <p className="text-xs text-muted-foreground mb-2">Nur Notizen mit diesen Tags anzeigen:</p>
            <TagSelector selected={filterTags} onChange={setFilterTags} compact />
            {filterTags.length > 0 && (
              <button
                onClick={() => setFilterTags([])}
                className="text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Create Note */}
        <div className="space-y-2 mb-4">
          <Textarea
            placeholder="Neue Notiz schreiben..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={2}
          />
          {noteText.trim() && (
            <>
              <TagSelector selected={noteTags} onChange={setNoteTags} compact />
              <div className="flex justify-end">
                <Button
                  onClick={() => noteMutation.mutate({
                    content: noteText.trim(),
                    tags: noteTags.join(','),
                  })}
                >
                  Speichern
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Grouped Notes List */}
        {groupedNotes.length > 0 ? (
          <div className="border-t pt-4 space-y-2">
            {groupedNotes.map(group => {
              const collapsed = isMonthCollapsed(group.key)
              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleMonth(group.key)}
                    className="flex items-center gap-2 w-full text-left py-2 px-1 hover:bg-accent/50 rounded-md transition-colors"
                  >
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
                    <span className="text-sm font-medium">{group.label}</span>
                    <span className="text-xs text-muted-foreground">({group.notes.length})</span>
                  </button>

                  {!collapsed && (
                    <div className="space-y-3 ml-6 mt-1 mb-3">
                      {group.notes.map(note => (
                        <div key={note.id} className={cn(
                          'flex gap-3 group',
                          note.type === 'jourfix' && 'border-l-2 border-primary/30 pl-3'
                        )}>
                          <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-20 flex-shrink-0">
                            {formatDate(note.date)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {note.type === 'jourfix' && (
                                <Badge variant="secondary" className="text-xs">Jour Fixe</Badge>
                              )}
                            </div>
                            {editingNoteId === note.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editNoteText}
                                  onChange={e => setEditNoteText(e.target.value)}
                                  rows={2}
                                  autoFocus
                                />
                                <TagSelector selected={editNoteTags} onChange={setEditNoteTags} compact />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => updateNoteMutation.mutate({
                                      id: note.id,
                                      content: editNoteText,
                                      tags: editNoteTags.join(','),
                                    })}
                                    disabled={!editNoteText.trim()}
                                  >
                                    Speichern
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Abbrechen</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-line">{note.content}</p>
                                <TagPills tags={note.tags} compact />
                              </>
                            )}
                          </div>
                          {editingNoteId !== note.id && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id)
                                  setEditNoteText(note.content)
                                  setEditNoteTags((note.tags || '').split(',').map(t => t.trim()).filter(Boolean))
                                }}
                                className="text-muted-foreground hover:text-foreground"
                                title="Bearbeiten"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteNote(note.id)}
                                className="text-muted-foreground hover:text-destructive"
                                title="Löschen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : !noteText && (
          <div className="border-t pt-4">
            {filterTags.length > 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Keine Notizen mit den gewaehlten Tags.
              </p>
            ) : (
              <div className="rounded-md bg-muted/30 border border-dashed p-4 space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground/80">So funktionieren Notizen:</p>
                <ul className="space-y-1.5 ml-1">
                  <li className="flex gap-2">
                    <span className="text-muted-foreground/60">1.</span>
                    <span>Beobachtungen unter der Woche hier festhalten — Lob, Feedback, Auffaelligkeiten</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted-foreground/60">2.</span>
                    <span>Tags helfen beim Filtern (z.B. alle &quot;Feedback&quot;-Notizen vor dem Jahresgespraech)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted-foreground/60">3.</span>
                    <span>Allgemeine Notizen aus Jour Fixes erscheinen hier automatisch</span>
                  </li>
                </ul>
                <p className="text-xs pt-1 border-t border-dashed">
                  Tipp: Die JF-Vorbereitung (Agenda-Themen) findest du im Tab &quot;Uebersicht&quot;.
                </p>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={confirmDeleteNote !== null}
          onConfirm={() => { if (confirmDeleteNote) deleteNoteMutation.mutate(confirmDeleteNote) }}
          onCancel={() => setConfirmDeleteNote(null)}
          title="Notiz löschen"
          message="Diese Notiz wird unwiderruflich gelöscht."
          confirmLabel="Löschen"
          variant="danger"
        />
      </CardContent>
    </Card>
  )
}
