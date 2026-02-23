import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { OnboardingTour } from '@/components/tour/OnboardingTour'
import type { TourStep } from '@/components/tour/OnboardingTour'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingSpinner } from '@/components/ui/loading'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AgreementsCard } from '@/components/employee/AgreementsCard'
import { GoalsCard } from '@/components/employee/GoalsCard'
import { DevPlanCard } from '@/components/employee/DevPlanCard'
import { NotesSection } from '@/components/employee/NotesSection'
import { MoodTrend } from '@/components/employee/MoodTrend'
import { TagPills } from '@/components/ui/tag-selector'
import { formatDate, statusColor, statusLabel, isOverdue, daysAgo, cn, MOOD_EMOJIS, MOOD_LABELS } from '@/lib/utils'
import {
  ArrowLeft, Edit2, Save, X, Upload, Calendar, Briefcase, FolderKanban,
  Plus, Trash2, Clock, MessageSquare, StickyNote, ChevronDown, ListTodo, Cake, Heart, Loader2, Check, Printer,
  User, Columns3, Sparkles
} from 'lucide-react'
import type { Employee, Note, Project, AgendaItem, JourFixSession } from '@/types'

const EMPLOYEE_TOUR: TourStep[] = [
  {
    id: 'emp-welcome',
    target: null,
    title: 'Mitarbeiter-Seite',
    description: 'Hier verwaltest du alles rund um diesen Mitarbeiter — Projekte, Vereinbarungen und Entwicklung.',
    icon: User,
  },
  {
    id: 'emp-tabs',
    target: 'tour-emp-tabs',
    title: 'Vier Bereiche',
    description: 'Wechsle zwischen Uebersicht, Entwicklung, Notizen und Historie.',
    icon: Columns3,
    position: 'bottom',
  },
  {
    id: 'emp-jf',
    target: 'tour-emp-jf',
    title: 'Jour Fixe starten',
    description: 'Starte hier dein woechentliches 1:1-Gespraech. Alle Aenderungen werden gesammelt und am Ende gespeichert.',
    icon: MessageSquare,
    position: 'bottom',
  },
  {
    id: 'emp-agenda',
    target: 'tour-emp-agenda',
    title: 'JF-Vorbereitung',
    description: 'Sammle unter der Woche Themen fuer das naechste Gespraech — optional mit Projekt-Zuordnung.',
    icon: ListTodo,
    position: 'bottom',
  },
]

export function EmployeePage() {
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', department: '', responsibilities: '', start_date: '', birthday: '', personal_notes: '' })
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', scope: '' })
  const [showCompleted, setShowCompleted] = useState(false)
  const [agendaText, setAgendaText] = useState('')
  const [agendaProject, setAgendaProject] = useState<string>('')
  const [showPersonal, setShowPersonal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoSuccess, setPhotoSuccess] = useState(false)
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('teamlead-tour-employee'))
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingResult, setBriefingResult] = useState<string | null>(null)
  const [briefingError, setBriefingError] = useState<string | null>(null)
  const [showBriefing, setShowBriefing] = useState(false)

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employee', employeeId],
    queryFn: () => api.getEmployee(employeeId),
  })

  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  })

  const { data: agenda = [] } = useQuery<AgendaItem[]>({
    queryKey: ['agenda', employeeId],
    queryFn: () => api.getAgenda(employeeId),
  })

  const { data: jourfixHistory = [] } = useQuery<JourFixSession[]>({
    queryKey: ['jourfix-history', employeeId],
    queryFn: () => api.getJourfixHistory(employeeId),
  })

  const { data: kiSettings } = useQuery({
    queryKey: ['ki-settings'],
    queryFn: api.getKISettings,
  })

  const kiConfigured = kiSettings?.enabled !== false && kiSettings?.provider && (kiSettings.provider === 'ollama' || kiSettings?.api_key_set)

  const handleBriefing = async () => {
    setBriefingLoading(true)
    setBriefingResult(null)
    setBriefingError(null)
    setShowBriefing(true)
    try {
      const res = await api.getJourfixBriefing(employeeId)
      if (res.error) {
        setBriefingError(res.error)
      } else {
        setBriefingResult(res.briefing)
      }
    } catch (err: any) {
      setBriefingError(err.message || 'Unbekannter Fehler')
    } finally {
      setBriefingLoading(false)
    }
  }

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      processed = processed.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
      if (/^\s*[-*]\s/.test(line)) {
        const text = line.replace(/^\s*[-*]\s/, '')
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processedText }} />
      }
      if (/^\s*\d+\.\s/.test(line)) {
        const text = line.replace(/^\s*\d+\.\s/, '')
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: processedText }} />
      }
      if (!line.trim()) return <div key={i} className="h-2" />
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />
    })
  }

  const agendaMutation = useMutation({
    mutationFn: (data: { content: string; project_id?: number }) => api.createAgendaItem(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda', employeeId] })
      setAgendaText('')
      setAgendaProject('')
    },
  })

  const deleteAgendaMutation = useMutation({
    mutationFn: (id: number) => api.deleteAgendaItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda', employeeId] }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateEmployee(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setEditing(false)
    },
  })

  const photoMutation = useMutation({
    mutationFn: (file: File) => api.uploadPhoto(employeeId, file),
    onMutate: () => setPhotoUploading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setPhotoUploading(false)
      setPhotoSuccess(true)
      setTimeout(() => setPhotoSuccess(false), 2000)
    },
    onError: (err: Error) => {
      setPhotoUploading(false)
      alert(err.message || 'Foto-Upload fehlgeschlagen.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      navigate('/')
    },
  })

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; scope: string }) => {
      const project = await api.createProject(data)
      await api.addMember(project.id, { employee_id: employeeId, role_in_project: '' })
      return project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      setShowNewProject(false)
      setNewProject({ name: '', scope: '' })
    },
  })

  const startEditing = () => {
    if (employee) {
      setForm({
        name: employee.name,
        role: employee.role,
        department: employee.department,
        responsibilities: employee.responsibilities,
        start_date: employee.start_date || '',
        birthday: employee.birthday || '',
        personal_notes: employee.personal_notes || '',
      })
      setEditing(true)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (!employee) return <div className="p-8">Mitarbeiter nicht gefunden</div>

  // Birthday calculation
  const birthdayInfo = employee.birthday ? (() => {
    const today = new Date()
    const [y, m, d] = employee.birthday!.split('-').map(Number)
    const nextBday = new Date(today.getFullYear(), m - 1, d)
    if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1)
    const daysUntil = Math.ceil((nextBday.getTime() - today.getTime()) / 86400000)
    return { label: `${d}.${m}.`, daysUntil }
  })() : null

  // Last JF info
  const lastJf = jourfixHistory.length > 0 ? jourfixHistory[0] : null
  const lastJfDays = lastJf?.completed_at ? daysAgo(lastJf.completed_at) : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar src={employee.photo_path} name={employee.name} size="lg" />
              {photoUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              ) : photoSuccess ? (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/70 rounded-full">
                  <Check className="h-5 w-5 text-white" />
                </div>
              ) : (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Foto hochladen (JPG, PNG, WebP)">
                  <Upload className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) photoMutation.mutate(file)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Rolle</label>
                      <Input
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        placeholder="z.B. SEO Manager"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Abteilung</label>
                      <Input
                        value={form.department}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        placeholder="z.B. Performance Marketing"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Startdatum</label>
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={e => setForm({ ...form, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Geburtstag</label>
                      <Input
                        type="date"
                        value={form.birthday}
                        onChange={e => setForm({ ...form, birthday: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Verantwortlichkeiten</label>
                    <Textarea
                      value={form.responsibilities}
                      onChange={e => setForm({ ...form, responsibilities: e.target.value })}
                      placeholder="z.B. SEO-Strategie, Content-Planung"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Persönliches</label>
                    <Textarea
                      value={form.personal_notes}
                      onChange={e => setForm({ ...form, personal_notes: e.target.value })}
                      placeholder="z.B. Hat eine Katze, Kind heißt Max, trinkt gerne Chai Latte..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={!form.name.trim()}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Speichern
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{employee.name}</h1>
                    <Button size="icon-sm" variant="ghost" onClick={startEditing} title="Bearbeiten">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {employee.role && (
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> {employee.role}
                      {employee.department && ` — ${employee.department}`}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1">
                    {employee.start_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Seit {formatDate(employee.start_date)}
                      </p>
                    )}
                    {birthdayInfo && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Cake className="h-3.5 w-3.5" /> {birthdayInfo.label}
                        {birthdayInfo.daysUntil === 0 && <Badge className="bg-pink-100 text-pink-700 text-xs ml-0.5">Heute!</Badge>}
                        {birthdayInfo.daysUntil === 1 && <Badge className="bg-pink-100 text-pink-700 text-xs ml-0.5">Morgen!</Badge>}
                        {birthdayInfo.daysUntil > 1 && birthdayInfo.daysUntil <= 7 && <Badge variant="secondary" className="text-xs ml-0.5">In {birthdayInfo.daysUntil} Tagen</Badge>}
                      </p>
                    )}
                  </div>
                  {employee.responsibilities && (
                    <p className="text-sm mt-3 whitespace-pre-line">{employee.responsibilities}</p>
                  )}
                  {employee.personal_notes && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowPersonal(!showPersonal)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !showPersonal && '-rotate-90')} />
                        <Heart className="h-3.5 w-3.5" /> Persönliches
                      </button>
                      {showPersonal && (
                        <div className="mt-2 ml-5 p-3 rounded-md bg-muted/30 border border-dashed">
                          <p className="text-sm whitespace-pre-line">{employee.personal_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* JF Button + Last JF + Mood */}
            <div className="flex flex-col items-end gap-2" data-tour="tour-emp-jf">
              <div className="flex items-center gap-2">
                {kiConfigured && (
                  <Button variant="outline" className="whitespace-nowrap" onClick={handleBriefing}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    JF vorbereiten
                  </Button>
                )}
                <Link to={`/jourfix/${employeeId}`}>
                  <Button variant="outline" className="whitespace-nowrap">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Jour Fixe
                  </Button>
                </Link>
              </div>
              {lastJfDays !== null && (
                <p className={cn(
                  'text-xs flex items-center gap-1',
                  lastJfDays > 28 ? 'text-destructive' : lastJfDays > 14 ? 'text-yellow-600' : 'text-muted-foreground'
                )}>
                  <Clock className="h-3 w-3" />
                  Letztes JF: vor {lastJfDays} Tag{lastJfDays !== 1 ? 'en' : ''}
                </p>
              )}
              <MoodTrend employeeId={employeeId} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="uebersicht">
        <TabsList data-tour="tour-emp-tabs">
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="entwicklung">Entwicklung</TabsTrigger>
          <TabsTrigger value="notizen">Notizen</TabsTrigger>
          <TabsTrigger value="historie">Historie</TabsTrigger>
        </TabsList>

        {/* Tab: Übersicht — Projekte + Vereinbarungen + JF-Vorbereitung */}
        <TabsContent value="uebersicht">
          {/* Projects */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderKanban className="h-5 w-5" /> Projekte
              </h2>
              <Button size="sm" onClick={() => setShowNewProject(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Projekt
              </Button>
            </div>

            {(() => {
              const openProjects = (employee.projects || []).filter(p => p.status !== 'abgeschlossen')
              const completedProjects = (employee.projects || []).filter(p => p.status === 'abgeschlossen')
              const hasAny = openProjects.length > 0 || completedProjects.length > 0

              if (!hasAny) return (
                <EmptyState
                  icon={FolderKanban}
                  title="Keine Projekte"
                  description="Erstelle ein neues Projekt für diesen Mitarbeiter."
                  action={
                    <Button size="sm" onClick={() => setShowNewProject(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Projekt anlegen
                    </Button>
                  }
                />
              )

              return (
                <>
                  {openProjects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {openProjects.map(proj => (
                        <Link key={proj.id} to={`/projects/${proj.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{proj.name}</h3>
                                {proj.role_in_project && (
                                  <p className="text-sm text-muted-foreground">{proj.role_in_project}</p>
                                )}
                              </div>
                              <Badge className={statusColor(proj.status)}>
                                {statusLabel(proj.status)}
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {completedProjects.length > 0 && (
                    <div className={openProjects.length > 0 ? 'mt-4' : ''}>
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', !showCompleted && '-rotate-90')} />
                        {completedProjects.length} abgeschlossene{completedProjects.length === 1 ? 's' : ''} Projekt{completedProjects.length === 1 ? '' : 'e'}
                      </button>
                      {showCompleted && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {completedProjects.map(proj => (
                            <Link key={proj.id} to={`/projects/${proj.id}`}>
                              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full opacity-60">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium">{proj.name}</h3>
                                    {proj.role_in_project && (
                                      <p className="text-sm text-muted-foreground">{proj.role_in_project}</p>
                                    )}
                                  </div>
                                  <Badge className={statusColor(proj.status)}>
                                    {statusLabel(proj.status)}
                                  </Badge>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Vereinbarungen */}
          <AgreementsCard employeeId={employeeId} projects={employee.projects || []} />

          {/* JF Agenda */}
          <Card data-tour="tour-emp-agenda">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5" /> JF-Vorbereitung
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Themen für den nächsten Jour Fixe sammeln. Werden im JF angezeigt.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="Thema notieren..."
                  value={agendaText}
                  onChange={e => setAgendaText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && agendaText.trim()) {
                      agendaMutation.mutate({
                        content: agendaText.trim(),
                        project_id: agendaProject ? Number(agendaProject) : undefined,
                      })
                    }
                  }}
                  className="flex-1"
                />
                {employee.projects && employee.projects.length > 0 && (
                  <Select
                    value={agendaProject}
                    onChange={e => setAgendaProject(e.target.value)}
                    options={[
                      { value: '', label: 'Allgemein' },
                      ...employee.projects.filter(p => p.status !== 'abgeschlossen').map(p => ({
                        value: String(p.id),
                        label: p.name,
                      })),
                    ]}
                    className="w-48"
                  />
                )}
                {agendaText.trim() && (
                  <Button onClick={() => agendaMutation.mutate({
                    content: agendaText.trim(),
                    project_id: agendaProject ? Number(agendaProject) : undefined,
                  })}>
                    Hinzufügen
                  </Button>
                )}
              </div>
              {agenda.length > 0 ? (
                <div className="space-y-2">
                  {agenda.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-md border group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.content}</p>
                        {item.project_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.project_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAgendaMutation.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                        title="Entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border-t">
                  Noch keine Themen — notiere hier Punkte für den nächsten Jour Fixe.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Entwicklung — Entwicklungsplan + Ziele */}
        <TabsContent value="entwicklung">
          <DevPlanCard employeeId={employeeId} />
          <GoalsCard employeeId={employeeId} />
        </TabsContent>

        {/* Tab: Notizen */}
        <TabsContent value="notizen">
          <NotesSection employeeId={employeeId} />
        </TabsContent>

        {/* Tab: Historie — JF-Verlauf */}
        <TabsContent value="historie">
          {/* Mood Trend */}
          {jourfixHistory.some(s => s.mood != null) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Stimmungsverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {jourfixHistory
                    .filter(s => s.mood != null)
                    .slice(0, 12)
                    .reverse()
                    .map((s, i, arr) => (
                      <div key={s.id} className="flex flex-col items-center gap-1">
                        <span
                          className={cn('text-xl', i < arr.length - 1 && 'opacity-50')}
                          title={`${MOOD_LABELS[s.mood!]} — ${s.completed_at?.split('T')[0] || ''}`}
                        >
                          {MOOD_EMOJIS[s.mood!]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {s.completed_at ? formatDate(s.completed_at) : ''}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* JF Sessions */}
          {jourfixHistory.length > 0 ? (
            <div className="space-y-4">
              {jourfixHistory.map(session => (
                <Card key={session.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                          {session.completed_at ? `Jour Fixe vom ${formatDate(session.completed_at)}` : 'Laufende Session'}
                        </h3>
                        {session.mood != null && (
                          <span className="text-lg" title={MOOD_LABELS[session.mood]}>
                            {MOOD_EMOJIS[session.mood]}
                          </span>
                        )}
                      </div>
                      <Link to={`/jourfix/${session.id}/protocol`}>
                        <Button size="sm" variant="ghost" title="Protokoll drucken">
                          <Printer className="h-3.5 w-3.5 mr-1" /> Protokoll
                        </Button>
                      </Link>
                    </div>

                    {session.general_notes && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Allgemeine Notizen</p>
                        <p className="text-sm whitespace-pre-line">{session.general_notes}</p>
                      </div>
                    )}

                    {session.project_notes && session.project_notes.length > 0 && (
                      <div className="space-y-2">
                        {session.project_notes.map(pn => (
                          <div key={pn.id} className="pl-3 border-l-2 border-border">
                            <p className="text-xs font-medium text-muted-foreground">{pn.project_name}</p>
                            <p className="text-sm whitespace-pre-line">{pn.notes}</p>
                            <TagPills tags={pn.tags} compact />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Noch keine Jour Fixe"
              description="Starte den ersten Jour Fixe über den Button oben rechts."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onClose={() => setShowNewProject(false)}>
        <DialogHeader>
          <DialogTitle>Neues Projekt</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Projektname"
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
            autoFocus
          />
          <Textarea
            placeholder="Beschreibung / Scope"
            value={newProject.scope}
            onChange={e => setNewProject({ ...newProject, scope: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewProject(false)}>Abbrechen</Button>
            <Button onClick={() => createProjectMutation.mutate(newProject)} disabled={!newProject.name.trim()}>Anlegen</Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Delete Employee */}
      <ConfirmDialog
        open={confirmDelete}
        onConfirm={() => { setConfirmDelete(false); deleteMutation.mutate() }}
        onCancel={() => setConfirmDelete(false)}
        title="Mitarbeiter löschen"
        message={`"${employee.name}" und alle zugehörigen Daten (Projekte, Notizen, Jour Fixe) werden unwiderruflich gelöscht.`}
        confirmLabel="Endgültig löschen"
        variant="danger"
      />

      {/* KI JF-Briefing Dialog */}
      <Dialog open={showBriefing} onClose={() => setShowBriefing(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> KI-JF-Vorbereitung
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {briefingLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">KI bereitet vor...</p>
            </div>
          )}
          {briefingError && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
              {briefingError}
            </div>
          )}
          {briefingResult && (
            <div className="text-sm space-y-1 leading-relaxed">
              {renderMarkdown(briefingResult)}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setShowBriefing(false)}>Schliessen</Button>
        </div>
      </Dialog>

      {showTour && (
        <OnboardingTour
          steps={EMPLOYEE_TOUR}
          tourKey="teamlead-tour-employee"
          onDone={() => setShowTour(false)}
        />
      )}
    </div>
  )
}
