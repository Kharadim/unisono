import { useParams, Link, useNavigate, useBlocker } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { OnboardingTour } from '@/components/tour/OnboardingTour'
import type { TourStep } from '@/components/tour/OnboardingTour'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TagSelector } from '@/components/ui/tag-selector'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MoodSelector } from '@/components/jourfix/MoodSelector'
import { JFAgreementForm } from '@/components/jourfix/JFAgreementForm'
import { JFGoalsCard } from '@/components/jourfix/JFGoalsCard'
import { JFAgreementsCard } from '@/components/jourfix/JFAgreementsCard'
import { JFDevPlanCard } from '@/components/jourfix/JFDevPlanCard'
import { formatDate, formatDateTime, statusColor, statusLabel, isOverdue, MOOD_EMOJIS, MOOD_LABELS, cn } from '@/lib/utils'
import {
  ArrowLeft, ChevronDown, MessageSquare, CheckCircle2,
  Circle, Loader2, Target, BarChart3, Plus, X, Send,
  AlertTriangle, Trash2, History, ListTodo, Square, CheckSquare, Info, Printer, Save,
  PanelRight, BookOpen, ChevronUp, Edit2
} from 'lucide-react'
import type { Project, Milestone, KPI, JourFixSession, Employee, AgendaItem, Goal, DevPlan, Agreement } from '@/types'

const JOURFIX_TOUR: TourStep[] = [
  {
    id: 'jf-welcome',
    target: null,
    title: 'Jour Fixe',
    description: 'Links siehst du alle Projekte als Akkordeon — klicke sie auf um Status, Milestones und KPIs zu besprechen.',
    icon: MessageSquare,
  },
  {
    id: 'jf-sidebar',
    target: 'tour-jf-sidebar',
    title: 'Seitenleiste',
    description: 'Rechts findest du zwei Tabs: Gespraech (Notizen + Themen) und Entwicklung (Ziele + Plan).',
    icon: PanelRight,
    position: 'bottom',
  },
  {
    id: 'jf-complete',
    target: 'tour-jf-complete',
    title: 'Abschliessen',
    description: 'Wenn ihr fertig seid: Alle Aenderungen werden in einer Transaktion gespeichert.',
    icon: Send,
    position: 'bottom',
  },
]

const GUIDE_PHASES = [
  {
    phase: 'Check-in',
    time: '~2 Min',
    goal: 'Ankommen, Arbeitsbelastung einschaetzen',
    questions: [
      'Wie wuerdest du deine aktuelle Arbeitslast beschreiben — machbar, fordernd, zu viel?',
      'Was hat dich seit letzter Woche am meisten beschaeftigt?',
    ],
    tip: 'Stimmung im Mood-Selector festhalten',
  },
  {
    phase: 'Rueckblick',
    time: '~5 Min',
    goal: 'Fortschritte wuerdigen, Hindernisse verstehen',
    questions: [
      'Worauf bist du seit unserem letzten Gespraech besonders stolz?',
      'Wo bist du nicht weitergekommen — und was hat gefehlt?',
    ],
    tip: 'JF-Rueckblick oben pruefen: Was wurde seit letztem Mal erledigt?',
  },
  {
    phase: 'Themen',
    time: '~15 Min',
    goal: 'Prioritaeten klaeren, Entscheidungen treffen',
    questions: [
      'Wo brauchst du eine Entscheidung oder Freigabe von mir?',
      'Welches Risiko sollten wir jetzt adressieren, bevor es groesser wird?',
    ],
    tip: 'Projekte unten aufklappen, Blocker und Status dokumentieren',
  },
  {
    phase: 'Ausblick',
    time: '~3 Min',
    goal: 'Naechste Schritte verbindlich festhalten',
    questions: [
      'Was ist dein wichtigstes Ziel fuer die naechste Woche?',
      'Gibt es etwas, das du noch ansprechen moechtest?',
    ],
    tip: 'Neue Vereinbarungen direkt im Projekt anlegen',
  },
]

interface JFAgreement {
  content: string
  project_id: number | null
  due_date: string
}

interface LocalChanges {
  milestoneChanges: Record<number, string>
  milestoneEdits: Record<number, { name: string; due_date: string }>
  kpiChanges: Record<number, { value: string; unit: string }>
  projectStatusChanges: Record<number, { status?: string; status_text?: string }>
  projectNotes: Record<number, string>
  projectNoteTags: Record<number, string[]>
  generalNotes: string
  generalNotesTags: string[]
  newMilestones: { project_id: number; name: string; due_date: string; status: string }[]
  newKPIs: { project_id: number; label: string; value: string; unit: string }[]
  newAgreements: JFAgreement[]
  goalChanges: Record<number, string>
  agreementChanges: Record<number, string>
  measureChanges: Record<number, string>
  trainingChanges: Record<number, string>
  mood: number | null
}

const emptyChanges: LocalChanges = {
  milestoneChanges: {},
  milestoneEdits: {},
  kpiChanges: {},
  projectStatusChanges: {},
  projectNotes: {},
  projectNoteTags: {},
  generalNotes: '',
  generalNotesTags: [],
  newMilestones: [],
  newKPIs: [],
  newAgreements: [],
  goalChanges: {},
  agreementChanges: {},
  measureChanges: {},
  trainingChanges: {},
  mood: null,
}

export function JourFixePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const empId = Number(employeeId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [sessionId, setSessionId] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [devplan, setDevplan] = useState<DevPlan | null>(null)
  const [openProjectId, setOpenProjectId] = useState<number | null>(null)
  const [changes, setChanges] = useState<LocalChanges>({ ...emptyChanges })
  const [started, setStarted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newMilestoneFor, setNewMilestoneFor] = useState<number | null>(null)
  const [newMs, setNewMs] = useState({ name: '', due_date: '' })
  const [newKPIFor, setNewKPIFor] = useState<number | null>(null)
  const [newKpi, setNewKpi] = useState({ label: '', value: '', unit: '' })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null)
  const [recap, setRecap] = useState<any>(null)
  const [showRecap, setShowRecap] = useState(true)

  const { data: employee } = useQuery<Employee>({
    queryKey: ['employee', empId],
    queryFn: () => api.getEmployee(empId),
  })

  const { data: openSession } = useQuery({
    queryKey: ['jourfix-open', empId],
    queryFn: () => api.getOpenJourfix(empId),
  })

  const { data: jourfixHistory = [] } = useQuery<JourFixSession[]>({
    queryKey: ['jourfix-history', empId],
    queryFn: () => api.getJourfixHistory(empId),
  })

  const { data: agenda = [] } = useQuery<AgendaItem[]>({
    queryKey: ['agenda', empId],
    queryFn: () => api.getAgenda(empId),
  })

  const [discussedIds, setDiscussedIds] = useState<Set<number>>(new Set())
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('teamlead-tour-jourfix'))
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const DRAFT_KEY = `jf-draft-${empId}`

  // Auto-save draft to localStorage (debounced 2s)
  const saveDraft = useCallback(() => {
    if (!started || !sessionId) return
    const draft = {
      changes,
      discussedIds: Array.from(discussedIds),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }, [changes, discussedIds, started, sessionId, DRAFT_KEY])

  useEffect(() => {
    if (!started || !sessionId) return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(saveDraft, 2000)
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current) }
  }, [changes, discussedIds, started, sessionId, saveDraft])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
  }, [DRAFT_KEY])

  const startSession = async () => {
    const result = await api.startJourfix(empId)
    setSessionId(result.session_id)
    setProjects(result.projects)
    setGoals(result.goals || [])
    setAgreements(result.agreements || [])
    setDevplan(result.devplan || null)
    setOpenProjectId(null)

    // Load recap
    try {
      const recapData = await api.getJourfixRecap(empId)
      setRecap(recapData)
      const hasData = recapData.last_jf_date && (
        recapData.agreements_completed.length > 0 ||
        recapData.milestones_completed.length > 0 ||
        recapData.kpi_changes.length > 0
      )
      setShowRecap(!!hasData)
    } catch { setRecap(null) }

    // Restore draft if available
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setChanges(draft.changes || { ...emptyChanges })
        setDiscussedIds(new Set(draft.discussedIds || []))
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 4000)
      } catch {
        setChanges({ ...emptyChanges })
      }
    } else {
      setChanges({ ...emptyChanges })
    }
    setStarted(true)
  }

  const resumeSession = async (existingSessionId: number) => {
    const result = await api.resumeJourfix(existingSessionId)
    setSessionId(result.session_id)
    setProjects(result.projects)
    setGoals(result.goals || [])
    setAgreements(result.agreements || [])
    setDevplan(result.devplan || null)
    setOpenProjectId(null)

    // Load recap
    try {
      const recapData = await api.getJourfixRecap(empId)
      setRecap(recapData)
      const hasData = recapData.last_jf_date && (
        recapData.agreements_completed.length > 0 ||
        recapData.milestones_completed.length > 0 ||
        recapData.kpi_changes.length > 0
      )
      setShowRecap(!!hasData)
    } catch { setRecap(null) }

    // Restore draft if available
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setChanges(draft.changes || { ...emptyChanges })
        setDiscussedIds(new Set(draft.discussedIds || []))
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 4000)
      } catch {
        setChanges({ ...emptyChanges })
      }
    } else {
      setChanges({ ...emptyChanges })
    }
    setStarted(true)
  }

  const discardAndRestart = async () => {
    if (openSession?.session?.id) {
      clearDraft()
      await api.discardJourfix(openSession.session.id)
      queryClient.invalidateQueries({ queryKey: ['jourfix-open', empId] })
    }
    await startSession()
  }

  const discardOnly = async () => {
    if (openSession?.session?.id) {
      clearDraft()
      await api.discardJourfix(openSession.session.id)
      queryClient.invalidateQueries({ queryKey: ['jourfix-open', empId] })
    }
  }

  const toggleProject = (projectId: number) => {
    setOpenProjectId(prev => prev === projectId ? null : projectId)
    setNewMilestoneFor(null)
    setNewKPIFor(null)
    setNewMs({ name: '', due_date: '' })
    setNewKpi({ label: '', value: '', unit: '' })
  }

  const projectHasChanges = (projectId: number) => {
    const hasMsChanges = Object.entries(changes.milestoneChanges).some(([id]) => {
      return projects.find(p => p.id === projectId)?.milestones.some(m => m.id === Number(id))
    })
    const hasMsEdits = Object.entries(changes.milestoneEdits).some(([id]) => {
      return projects.find(p => p.id === projectId)?.milestones.some(m => m.id === Number(id))
    })
    const hasKpiChanges = Object.entries(changes.kpiChanges).some(([id]) => {
      return projects.find(p => p.id === projectId)?.kpis.some(k => k.id === Number(id))
    })
    const hasStatusChange = !!changes.projectStatusChanges[projectId]
    const hasNotes = !!changes.projectNotes[projectId]?.trim()
    const hasNewMs = changes.newMilestones.some(nm => nm.project_id === projectId)
    const hasNewKpi = changes.newKPIs.some(nk => nk.project_id === projectId)
    const hasAgreements = changes.newAgreements.some(a => a.project_id === projectId)
    return hasMsChanges || hasMsEdits || hasKpiChanges || hasStatusChange || hasNotes || hasNewMs || hasNewKpi || hasAgreements
  }

  const getMilestoneStatus = (ms: Milestone) => {
    return changes.milestoneChanges[ms.id] ?? ms.status
  }

  const toggleMilestone = (ms: Milestone) => {
    const current = getMilestoneStatus(ms)
    const next = current === 'offen' ? 'in_arbeit' : current === 'in_arbeit' ? 'done' : 'offen'
    setChanges(prev => ({
      ...prev,
      milestoneChanges: { ...prev.milestoneChanges, [ms.id]: next },
    }))
  }

  const getMilestoneName = (ms: Milestone) => {
    return changes.milestoneEdits[ms.id]?.name ?? ms.name
  }

  const getMilestoneDueDate = (ms: Milestone) => {
    return changes.milestoneEdits[ms.id]?.due_date ?? (ms.due_date || '')
  }

  const startEditMilestone = (ms: Milestone) => {
    setEditingMilestoneId(ms.id)
    // Initialize edit values if not already edited
    if (!changes.milestoneEdits[ms.id]) {
      setChanges(prev => ({
        ...prev,
        milestoneEdits: { ...prev.milestoneEdits, [ms.id]: { name: ms.name, due_date: ms.due_date || '' } },
      }))
    }
  }

  const updateMilestoneEdit = (msId: number, field: 'name' | 'due_date', val: string) => {
    setChanges(prev => {
      const existing = prev.milestoneEdits[msId] ?? { name: '', due_date: '' }
      return {
        ...prev,
        milestoneEdits: { ...prev.milestoneEdits, [msId]: { ...existing, [field]: val } },
      }
    })
  }

  const getKPIValue = (kpi: KPI) => {
    return changes.kpiChanges[kpi.id] ?? { value: kpi.value, unit: kpi.unit }
  }

  const updateKPI = (kpiId: number, field: 'value' | 'unit', val: string) => {
    setChanges(prev => {
      const existing = prev.kpiChanges[kpiId] ?? { value: '', unit: '' }
      return {
        ...prev,
        kpiChanges: { ...prev.kpiChanges, [kpiId]: { ...existing, [field]: val } },
      }
    })
  }

  const updateProjectStatus = (projectId: number, field: 'status' | 'status_text', val: string) => {
    setChanges(prev => ({
      ...prev,
      projectStatusChanges: {
        ...prev.projectStatusChanges,
        [projectId]: { ...prev.projectStatusChanges[projectId], [field]: val },
      },
    }))
  }

  const updateProjectNotes = (projectId: number, notes: string) => {
    setChanges(prev => ({
      ...prev,
      projectNotes: { ...prev.projectNotes, [projectId]: notes },
    }))
  }

  const addNewMilestone = (projectId: number) => {
    if (!newMs.name.trim()) return
    setChanges(prev => ({
      ...prev,
      newMilestones: [...prev.newMilestones, { project_id: projectId, name: newMs.name, due_date: newMs.due_date, status: 'offen' }],
    }))
    setNewMs({ name: '', due_date: '' })
    setNewMilestoneFor(null)
  }

  const addNewKPI = (projectId: number) => {
    if (!newKpi.label.trim()) return
    setChanges(prev => ({
      ...prev,
      newKPIs: [...prev.newKPIs, { project_id: projectId, label: newKpi.label, value: newKpi.value, unit: newKpi.unit }],
    }))
    setNewKpi({ label: '', value: '', unit: '' })
    setNewKPIFor(null)
  }

  const toggleGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const current = changes.goalChanges[goalId] ?? goal.status
    const cycle: Record<string, string> = { offen: 'in_arbeit', in_arbeit: 'erreicht', erreicht: 'offen', nicht_erreicht: 'offen' }
    setChanges(prev => ({
      ...prev,
      goalChanges: { ...prev.goalChanges, [goalId]: cycle[current] || 'offen' },
    }))
  }

  const toggleAgreement = (agreementId: number) => {
    const agreement = agreements.find(a => a.id === agreementId)
    if (!agreement) return
    const current = changes.agreementChanges[agreementId] ?? agreement.status
    const next = current === 'offen' ? 'erledigt' : 'offen'
    setChanges(prev => ({
      ...prev,
      agreementChanges: { ...prev.agreementChanges, [agreementId]: next },
    }))
  }

  const toggleMeasure = (measureId: number) => {
    if (!devplan) return
    const measure = devplan.areas.flatMap(a => a.measures).find(m => m.id === measureId)
    if (!measure) return
    const current = changes.measureChanges[measureId] ?? measure.status
    const cycle: Record<string, string> = { offen: 'in_arbeit', in_arbeit: 'erledigt', erledigt: 'offen' }
    setChanges(prev => ({
      ...prev,
      measureChanges: { ...prev.measureChanges, [measureId]: cycle[current] || 'offen' },
    }))
  }

  const toggleTraining = (trainingId: number) => {
    if (!devplan) return
    const training = devplan.trainings.find(t => t.id === trainingId)
    if (!training) return
    const current = changes.trainingChanges[trainingId] ?? training.status
    const cycle: Record<string, string> = { vorgeschlagen: 'genehmigt', genehmigt: 'abgeschlossen', abgeschlossen: 'vorgeschlagen' }
    setChanges(prev => ({
      ...prev,
      trainingChanges: { ...prev.trainingChanges, [trainingId]: cycle[current] || 'vorgeschlagen' },
    }))
  }

  const completeSession = async () => {
    if (!sessionId) return
    setCompleting(true)
    try {
      await api.completeJourfix(sessionId, {
        general_notes: changes.generalNotes,
        general_notes_tags: changes.generalNotesTags.join(','),
        project_notes: Object.entries(changes.projectNotes)
          .filter(([_, notes]) => notes.trim())
          .map(([pid, notes]) => ({
            project_id: Number(pid),
            notes,
            tags: (changes.projectNoteTags[Number(pid)] || []).join(','),
          })),
        milestone_changes: (() => {
          // Merge status changes and edits (name/due_date) for each milestone
          const allIds = new Set([
            ...Object.keys(changes.milestoneChanges),
            ...Object.keys(changes.milestoneEdits),
          ])
          return Array.from(allIds).map(id => {
            const numId = Number(id)
            const result: any = { id: numId }
            if (changes.milestoneChanges[numId] !== undefined) {
              result.status = changes.milestoneChanges[numId]
            }
            if (changes.milestoneEdits[numId]) {
              result.name = changes.milestoneEdits[numId].name
              result.due_date = changes.milestoneEdits[numId].due_date
            }
            return result
          })
        })(),
        kpi_changes: Object.entries(changes.kpiChanges)
          .map(([id, vals]) => ({ id: Number(id), ...vals })),
        project_status_changes: Object.entries(changes.projectStatusChanges)
          .map(([pid, vals]) => ({ project_id: Number(pid), ...vals })),
        new_milestones: changes.newMilestones,
        new_kpis: changes.newKPIs,
        new_agreements: changes.newAgreements.map(a => ({
          content: a.content,
          project_id: a.project_id,
          due_date: a.due_date || undefined,
        })),
        goal_changes: Object.entries(changes.goalChanges)
          .map(([id, status]) => ({ id: Number(id), status })),
        agreement_changes: Object.entries(changes.agreementChanges)
          .map(([id, status]) => ({ id: Number(id), status })),
        measure_changes: Object.entries(changes.measureChanges)
          .map(([id, status]) => ({ id: Number(id), status })),
        training_changes: Object.entries(changes.trainingChanges)
          .map(([id, status]) => ({ id: Number(id), status })),
        mood: changes.mood,
      })
      // Mark discussed agenda items
      await Promise.all(
        Array.from(discussedIds).map(id => api.markAgendaDiscussed(id))
      )
      clearDraft()
      queryClient.invalidateQueries()
      setCompletedSessionId(sessionId)
      setShowConfirm(false)
    } catch (e) {
      alert('Fehler beim Speichern: ' + (e as Error).message)
    } finally {
      setCompleting(false)
    }
  }

  const totalChanges =
    Object.keys(changes.milestoneChanges).length +
    Object.keys(changes.milestoneEdits).length +
    Object.keys(changes.kpiChanges).length +
    Object.keys(changes.projectStatusChanges).length +
    Object.values(changes.projectNotes).filter(n => n.trim()).length +
    changes.newMilestones.length +
    changes.newKPIs.length +
    changes.newAgreements.length +
    Object.keys(changes.goalChanges).length +
    Object.keys(changes.agreementChanges).length +
    Object.keys(changes.measureChanges).length +
    Object.keys(changes.trainingChanges).length +
    (changes.generalNotes.trim() ? 1 : 0) +
    (changes.mood ? 1 : 0)

  // Browser close/refresh protection
  useEffect(() => {
    if (!started || totalChanges === 0) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [started, totalChanges])

  // SPA navigation protection (React Router)
  const blocker = useBlocker(started && totalChanges > 0)

  // Success screen after completion
  if (completedSessionId) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Jour Fixe abgeschlossen</h1>
          <p className="text-muted-foreground">
            Alle Änderungen wurden gespeichert.
          </p>
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Link to={`/jourfix/${completedSessionId}/protocol`}>
            <Button size="lg">
              <Printer className="h-4 w-4 mr-2" /> Protokoll anzeigen
            </Button>
          </Link>
          <Link to={`/employees/${empId}`} className="text-sm text-muted-foreground hover:text-foreground">
            Zurück zu {employee?.name || 'Mitarbeiter'}
          </Link>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link to={`/employees/${empId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Zurück zu {employee?.name || 'Mitarbeiter'}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Jour Fixe mit {employee?.name || '...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {openSession?.has_open ? (
              <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-3">
                  Es gibt eine offene Session vom {formatDateTime(openSession.session.started_at)}.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => resumeSession(openSession.session.id)}>
                    Fortsetzen
                  </Button>
                  <Button variant="outline" onClick={discardAndRestart}>
                    Verwerfen &amp; neu starten
                  </Button>
                  <Button variant="destructive" onClick={discardOnly}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Verwerfen
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="lg" onClick={startSession}>
                <MessageSquare className="h-4 w-4 mr-2" /> Jour Fixe starten
              </Button>
            )}

            {/* History */}
            {jourfixHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" /> Vergangene Jour Fixes
                </h3>
                <div className="space-y-3">
                  {jourfixHistory.map(session => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {formatDateTime(session.completed_at)}
                            {session.mood && (
                              <span className="ml-2" title={MOOD_LABELS[session.mood]}>
                                {MOOD_EMOJIS[session.mood]}
                              </span>
                            )}
                          </span>
                        </div>
                        {session.general_notes && (
                          <p className="text-sm text-muted-foreground mb-2">{session.general_notes}</p>
                        )}
                        {session.project_notes && session.project_notes.length > 0 && (
                          <div className="space-y-1">
                            {session.project_notes.map(pn => (
                              <div key={pn.id} className="text-sm">
                                <span className="font-medium">{pn.project_name}:</span>{' '}
                                <span className="text-muted-foreground">{pn.notes}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active session
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            if (totalChanges > 0) {
              setShowCancelConfirm(true)
            } else {
              setStarted(false)
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Abbrechen
          </Button>
          <span className="font-semibold">
            Jour Fixe — {employee?.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Draft indicator */}
          {draftRestored && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 animate-pulse">
              <Save className="h-3 w-3" /> Entwurf wiederhergestellt
            </span>
          )}
          {draftSaved && !draftRestored && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3" /> Gesichert
            </span>
          )}
          {/* Mood Selector in top bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Stimmung:</span>
            <MoodSelector value={changes.mood} onChange={mood => setChanges(prev => ({ ...prev, mood }))} />
          </div>
          {totalChanges > 0 && (
            <Badge variant="secondary">{totalChanges} Änderung{totalChanges !== 1 ? 'en' : ''}</Badge>
          )}
          <Button onClick={() => setShowConfirm(true)} disabled={completing} data-tour="tour-jf-complete">
            <Send className="h-4 w-4 mr-2" /> Abschließen
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {/* Left: Projects */}
          <div className="flex-1 min-w-0">
        {/* Hint text */}
        {projects.length > 0 && openProjectId === null && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md bg-muted/50 text-sm text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0" />
            Klicke auf ein Projekt, um es zu bearbeiten.
          </div>
        )}

        {/* Gespraechsleitfaden */}
        <div className="mb-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Gespraechsleitfaden</span>
            <span className="ml-auto">
              {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          {showGuide && (
            <div className="mt-2 border border-dashed rounded-md bg-muted/20 p-4 space-y-4">
              {GUIDE_PHASES.map((phase, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{i + 1}. {phase.phase}</span>
                    <span className="text-xs text-muted-foreground">({phase.time})</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{phase.goal}</p>
                  <ul className="ml-4 space-y-0.5">
                    {phase.questions.map((q, qi) => (
                      <li key={qi} className="text-sm italic text-foreground/80">• {q}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">→ {phase.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recap Card — seit letztem JF */}
        {recap && recap.last_jf_date && (() => {
          const hasAgreements = recap.agreements_completed.length > 0
          const hasMilestones = recap.milestones_completed.length > 0
          const hasKpis = recap.kpi_changes.length > 0
          const hasAny = hasAgreements || hasMilestones || hasKpis
          return (
            <div className="mb-3">
              <button
                onClick={() => setShowRecap(!showRecap)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <History className="h-4 w-4" />
                <span className="font-medium">Rückblick seit letztem JF</span>
                <span className="text-xs">({formatDate(recap.last_jf_date)})</span>
                <span className="ml-auto">
                  {showRecap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              {showRecap && (
                <div className="mt-2 border border-dashed rounded-md bg-muted/20 p-4 space-y-3">
                  {!hasAny && (
                    <p className="text-sm text-muted-foreground text-center py-1">Keine Änderungen seit letztem JF.</p>
                  )}
                  {hasAgreements && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Erledigte Vereinbarungen</h4>
                      <div className="space-y-1">
                        {recap.agreements_completed.map((a: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>{a.content}</span>
                            {a.project_name && <Badge variant="secondary" className="text-[10px] ml-auto flex-shrink-0">{a.project_name}</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasMilestones && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Abgeschlossene Milestones</h4>
                      <div className="space-y-1">
                        {recap.milestones_completed.map((m: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Target className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span>{m.name}</span>
                            {m.project_name && <Badge variant="secondary" className="text-[10px] ml-auto flex-shrink-0">{m.project_name}</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasKpis && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">KPI-Änderungen</h4>
                      <div className="space-y-1">
                        {recap.kpi_changes.map((k: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <BarChart3 className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>
                              {k.label}: <span className="text-muted-foreground line-through">{k.old_value} {k.old_unit}</span> → <span className="font-medium">{k.new_value} {k.new_unit}</span>
                            </span>
                            {k.project_name && <Badge variant="secondary" className="text-[10px] ml-auto flex-shrink-0">{k.project_name}</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Projects Accordion */}
        {projects.length > 0 ? (
          <div className="space-y-2">
            {projects.map(proj => {
              const isOpen = openProjectId === proj.id
              const hasChanges = projectHasChanges(proj.id)
              const overdueCount = proj.milestones.filter(ms => {
                const st = getMilestoneStatus(ms)
                return st !== 'done' && isOverdue(ms.due_date)
              }).length
              const doneCount = proj.milestones.filter(ms => (getMilestoneStatus(ms)) === 'done').length

              return (
                <Card key={proj.id} className={cn(
                  hasChanges && 'ring-2 ring-primary/20',
                  !isOpen && overdueCount > 0 && 'border-destructive/40'
                )}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleProject(proj.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-accent/50 transition-colors rounded-t-lg"
                  >
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !isOpen && '-rotate-90')} />
                    <span className="font-semibold flex-1">{proj.name}</span>
                    <div className="flex items-center gap-2">
                      {overdueCount > 0 && (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />{overdueCount} überfällig
                        </Badge>
                      )}
                      {proj.milestones.length > 0 && (
                        <span className="text-xs text-muted-foreground">{doneCount}/{proj.milestones.length}</span>
                      )}
                      {hasChanges && <Badge variant="secondary" className="text-xs">Geändert</Badge>}
                      <Badge className={statusColor(changes.projectStatusChanges[proj.id]?.status ?? proj.status)}>
                        {statusLabel(changes.projectStatusChanges[proj.id]?.status ?? proj.status)}
                      </Badge>
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <CardContent className="pt-0 px-5 pb-5 space-y-6 border-t">
                      {/* Status */}
                      <div className="pt-4 flex gap-3">
                        <div className="w-40">
                          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                          <Select
                            value={changes.projectStatusChanges[proj.id]?.status ?? proj.status}
                            onChange={e => updateProjectStatus(proj.id, 'status', e.target.value)}
                            options={[
                              { value: 'aktiv', label: 'Aktiv' },
                              { value: 'pausiert', label: 'Pausiert' },
                              { value: 'abgeschlossen', label: 'Abgeschlossen' },
                            ]}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Statuszeile (wird auf der Projektkarte angezeigt)
                          </label>
                          <Input
                            value={changes.projectStatusChanges[proj.id]?.status_text ?? proj.status_text}
                            onChange={e => updateProjectStatus(proj.id, 'status_text', e.target.value)}
                            placeholder="z.B. Keyword-Mapping abgeschlossen"
                          />
                        </div>
                      </div>

                      {/* Milestones */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" /> Milestones
                        </h3>
                        <div className="space-y-2">
                          {proj.milestones.map(ms => {
                            const status = getMilestoneStatus(ms)
                            const msName = getMilestoneName(ms)
                            const msDue = getMilestoneDueDate(ms)
                            const overdue = status !== 'done' && isOverdue(msDue)
                            const changed = changes.milestoneChanges[ms.id] !== undefined || changes.milestoneEdits[ms.id] !== undefined
                            const isEditing = editingMilestoneId === ms.id
                            return (
                              <div key={ms.id} className={cn(
                                'flex items-center gap-3 p-3 rounded-md border group',
                                overdue && 'border-destructive/50 bg-destructive/5',
                                changed && 'ring-2 ring-primary/20'
                              )}>
                                <button onClick={() => toggleMilestone(ms)} title="Klicken zum Umschalten: Offen → In Arbeit → Erledigt">
                                  {status === 'done' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : status === 'in_arbeit' ? (
                                    <Loader2 className="h-5 w-5 text-amber-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                {isEditing ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      value={msName}
                                      onChange={e => updateMilestoneEdit(ms.id, 'name', e.target.value)}
                                      className="h-8 text-sm flex-1"
                                      autoFocus
                                      onKeyDown={e => { if (e.key === 'Escape') setEditingMilestoneId(null) }}
                                    />
                                    <Input
                                      type="date"
                                      value={msDue}
                                      onChange={e => updateMilestoneEdit(ms.id, 'due_date', e.target.value)}
                                      className="h-8 text-sm w-36"
                                    />
                                    <button
                                      onClick={() => setEditingMilestoneId(null)}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Fertig"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <p className={cn('text-sm', status === 'done' && 'line-through text-muted-foreground')}>
                                        {msName}
                                      </p>
                                      {msDue && (
                                        <p className={cn('text-xs', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                                          {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                                          Fällig: {formatDate(msDue)}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => startEditMilestone(ms)}
                                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                                      title="Bearbeiten"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                <Badge className={statusColor(status)}>{statusLabel(status)}</Badge>
                              </div>
                            )
                          })}
                          {/* New milestones for this project */}
                          {changes.newMilestones
                            .filter(nm => nm.project_id === proj.id)
                            .map((nm, i) => (
                              <div key={`new-${i}`} className="flex items-center gap-3 p-3 rounded-md border border-dashed border-primary/30 bg-primary/5">
                                <Circle className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                  <p className="text-sm">{nm.name} <Badge variant="secondary" className="ml-2 text-xs">Neu</Badge></p>
                                  {nm.due_date && <p className="text-xs text-muted-foreground">Fällig: {formatDate(nm.due_date)}</p>}
                                </div>
                                <button
                                  onClick={() => setChanges(prev => ({
                                    ...prev,
                                    newMilestones: prev.newMilestones.filter((_, idx) =>
                                      !(prev.newMilestones[idx].project_id === proj.id &&
                                        prev.newMilestones[idx].name === nm.name)
                                    ),
                                  }))}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Entfernen"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>
                        {newMilestoneFor === proj.id ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                                <Input
                                  placeholder="z.B. Keyword-Recherche abschließen"
                                  value={newMs.name}
                                  onChange={e => setNewMs({ ...newMs, name: e.target.value })}
                                  onKeyDown={e => e.key === 'Enter' && newMs.name.trim() && addNewMilestone(proj.id)}
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fällig am</label>
                                <Input type="date" value={newMs.due_date} onChange={e => setNewMs({ ...newMs, due_date: e.target.value })} className="w-40" />
                              </div>
                              <div className="flex gap-1 items-end">
                                <Button size="sm" onClick={() => addNewMilestone(proj.id)} disabled={!newMs.name.trim()}>Anlegen</Button>
                                <Button size="sm" variant="ghost" onClick={() => setNewMilestoneFor(null)}>Abbrechen</Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewMilestoneFor(proj.id)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Milestone
                          </Button>
                        )}
                      </div>

                      {/* KPIs */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" /> KPIs
                        </h3>
                        <div className="space-y-2">
                          {proj.kpis.map(kpi => {
                            const current = getKPIValue(kpi)
                            const changed = changes.kpiChanges[kpi.id] !== undefined
                            return (
                              <div key={kpi.id} className={cn(
                                'flex items-center gap-3 p-3 rounded-md border',
                                changed && 'ring-2 ring-primary/20'
                              )}>
                                <span className="text-sm font-medium flex-1">{kpi.label}</span>
                                <Input
                                  value={current.value}
                                  onChange={e => updateKPI(kpi.id, 'value', e.target.value)}
                                  className="w-24 h-8 text-sm"
                                />
                                <Input
                                  value={current.unit}
                                  onChange={e => updateKPI(kpi.id, 'unit', e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  placeholder="Einheit"
                                />
                              </div>
                            )
                          })}
                          {/* New KPIs */}
                          {changes.newKPIs
                            .filter(nk => nk.project_id === proj.id)
                            .map((nk, i) => (
                              <div key={`new-kpi-${i}`} className="flex items-center gap-3 p-3 rounded-md border border-dashed border-primary/30 bg-primary/5">
                                <span className="text-sm font-medium flex-1">{nk.label} <Badge variant="secondary" className="ml-2 text-xs">Neu</Badge></span>
                                <span className="text-sm font-mono">{nk.value} {nk.unit}</span>
                                <button
                                  onClick={() => setChanges(prev => ({
                                    ...prev,
                                    newKPIs: prev.newKPIs.filter((_, idx) =>
                                      !(prev.newKPIs[idx].project_id === proj.id &&
                                        prev.newKPIs[idx].label === nk.label)
                                    ),
                                  }))}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Entfernen"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>
                        {newKPIFor === proj.id ? (
                          <div className="mt-3 flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bezeichnung</label>
                              <Input placeholder="z.B. Sichtbarkeitsindex" value={newKpi.label} onChange={e => setNewKpi({ ...newKpi, label: e.target.value })} autoFocus />
                            </div>
                            <div className="w-24">
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Wert</label>
                              <Input placeholder="42" value={newKpi.value} onChange={e => setNewKpi({ ...newKpi, value: e.target.value })} />
                            </div>
                            <div className="w-20">
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Einheit</label>
                              <Input placeholder="%" value={newKpi.unit} onChange={e => setNewKpi({ ...newKpi, unit: e.target.value })} />
                            </div>
                            <div className="flex gap-1 items-end">
                              <Button size="sm" onClick={() => addNewKPI(proj.id)} disabled={!newKpi.label.trim()}>Anlegen</Button>
                              <Button size="sm" variant="ghost" onClick={() => setNewKPIFor(null)}>Abbrechen</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewKPIFor(proj.id)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> KPI
                          </Button>
                        )}
                      </div>

                      {/* Agreements */}
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Vereinbarungen</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Absprachen mit Termin festhalten.
                        </p>
                        <JFAgreementForm
                          projectId={proj.id}
                          agreements={changes.newAgreements}
                          onAdd={ag => setChanges(prev => ({ ...prev, newAgreements: [...prev.newAgreements, ag] }))}
                          onRemove={idx => setChanges(prev => ({ ...prev, newAgreements: prev.newAgreements.filter((_, i) => i !== idx) }))}
                        />
                      </div>

                      {/* Project Notes */}
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Gesprächsnotizen</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Was wurde besprochen? Wird als Protokoll gespeichert und auf der Projektseite angezeigt.
                        </p>
                        <Textarea
                          value={changes.projectNotes[proj.id] ?? ''}
                          onChange={e => updateProjectNotes(proj.id, e.target.value)}
                          placeholder="Besprochene Punkte, Entscheidungen, nächste Schritte..."
                          rows={3}
                        />
                        {changes.projectNotes[proj.id]?.trim() && (
                          <div className="mt-2">
                            <TagSelector
                              selected={changes.projectNoteTags[proj.id] || []}
                              onChange={tags => setChanges(prev => ({
                                ...prev,
                                projectNoteTags: { ...prev.projectNoteTags, [proj.id]: tags },
                              }))}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Keine aktiven Projekte für diesen Mitarbeiter.
            </CardContent>
          </Card>
        )}
          </div>

          {/* Right: Sidebar — Tabbed */}
          <div className="w-80 flex-shrink-0 self-start sticky top-6" data-tour="tour-jf-sidebar">
            <Tabs defaultValue="gespraech">
              <TabsList className="mb-4">
                <TabsTrigger value="gespraech" className="text-xs px-3 py-2">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Gespraech
                </TabsTrigger>
                <TabsTrigger value="entwicklung" className="text-xs px-3 py-2">
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  Entwicklung
                  {(goals.length > 0 || devplan) && (
                    <Badge variant="secondary" className="text-[10px] ml-1.5 px-1.5 py-0">{goals.length + (devplan ? devplan.areas.flatMap(a => a.measures).filter(m => (changes.measureChanges[m.id] ?? m.status) !== 'erledigt').length : 0)}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gespraech" className="space-y-4">
                {/* Agenda — first, this is the conversation guide */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ListTodo className="h-4 w-4" /> Vorbereitete Themen
                      {agenda.length > 0 && <Badge variant="secondary" className="text-xs">{agenda.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agenda.length > 0 ? (
                      <>
                        <div className="space-y-1.5">
                          {agenda.map(item => {
                            const discussed = discussedIds.has(item.id)
                            return (
                              <button
                                key={item.id}
                                onClick={() => setDiscussedIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(item.id)) next.delete(item.id)
                                  else next.add(item.id)
                                  return next
                                })}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-md border w-full text-left transition-colors',
                                  discussed && 'bg-muted/50'
                                )}
                              >
                                {discussed ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs', discussed && 'line-through text-muted-foreground')}>{item.content}</p>
                                  {item.project_name && (
                                    <p className="text-xs text-muted-foreground">{item.project_name}</p>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Abgehakte Themen verschwinden nach dem Abschließen.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Keine Themen vorbereitet. Themen kannst du auf der Mitarbeiter-Seite sammeln.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Open Items: Agreements + Dev Measures */}
                <JFAgreementsCard
                  agreements={agreements}
                  agreementChanges={changes.agreementChanges}
                  onToggle={toggleAgreement}
                  devAreas={devplan?.areas}
                  measureChanges={changes.measureChanges}
                  onToggleMeasure={toggleMeasure}
                />

                {/* General Notes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Allgemeine Notizen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Projektübergreifend: Feedback, Entwicklung, Vereinbarungen.
                    </p>
                    <Textarea
                      value={changes.generalNotes}
                      onChange={e => setChanges(prev => ({ ...prev, generalNotes: e.target.value }))}
                      placeholder="z.B. Lob für Eigeninitiative..."
                      rows={4}
                    />
                    {changes.generalNotes.trim() && (
                      <div className="mt-2">
                        <TagSelector
                          selected={changes.generalNotesTags}
                          onChange={tags => setChanges(prev => ({ ...prev, generalNotesTags: tags }))}
                          compact
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="entwicklung" className="space-y-4">
                {/* Goals */}
                <JFGoalsCard
                  goals={goals}
                  goalChanges={changes.goalChanges}
                  onToggle={toggleGoal}
                />

                {/* Development Plan */}
                {devplan && (
                  <JFDevPlanCard
                    devplan={devplan}
                    measureChanges={changes.measureChanges}
                    trainingChanges={changes.trainingChanges}
                    onToggleMeasure={toggleMeasure}
                    onToggleTraining={toggleTraining}
                  />
                )}

                {goals.length === 0 && !devplan && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Keine Ziele oder Entwicklungsplan vorhanden.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Confirm Complete Dialog */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogHeader>
          <DialogTitle>Jour Fixe abschließen?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {totalChanges} Änderung{totalChanges !== 1 ? 'en' : ''} werden gespeichert.
          </p>

          {/* Summary */}
          <div className="text-sm space-y-1">
            {Object.keys(changes.milestoneChanges).length > 0 && (
              <p>• {Object.keys(changes.milestoneChanges).length} Milestone-Status geändert</p>
            )}
            {Object.keys(changes.kpiChanges).length > 0 && (
              <p>• {Object.keys(changes.kpiChanges).length} KPI-Werte aktualisiert</p>
            )}
            {Object.keys(changes.projectStatusChanges).length > 0 && (
              <p>• {Object.keys(changes.projectStatusChanges).length} Projekt-Status geändert</p>
            )}
            {changes.newMilestones.length > 0 && (
              <p>• {changes.newMilestones.length} neue Milestones</p>
            )}
            {changes.newKPIs.length > 0 && (
              <p>• {changes.newKPIs.length} neue KPIs</p>
            )}
            {changes.newAgreements.length > 0 && (
              <p>• {changes.newAgreements.length} neue Vereinbarung{changes.newAgreements.length !== 1 ? 'en' : ''}</p>
            )}
            {Object.keys(changes.agreementChanges).length > 0 && (
              <p>• {Object.keys(changes.agreementChanges).length} Vereinbarung{Object.keys(changes.agreementChanges).length !== 1 ? 'en' : ''} aktualisiert</p>
            )}
            {Object.keys(changes.goalChanges).length > 0 && (
              <p>• {Object.keys(changes.goalChanges).length} Ziel-Status geändert</p>
            )}
            {Object.keys(changes.measureChanges).length > 0 && (
              <p>• {Object.keys(changes.measureChanges).length} Massnahmen-Status geändert</p>
            )}
            {Object.keys(changes.trainingChanges).length > 0 && (
              <p>• {Object.keys(changes.trainingChanges).length} Weiterbildungs-Status geändert</p>
            )}
            {Object.values(changes.projectNotes).filter(n => n.trim()).length > 0 && (
              <p>• Projekt-Notizen für {Object.values(changes.projectNotes).filter(n => n.trim()).length} Projekt(e)</p>
            )}
            {changes.generalNotes.trim() && <p>• Allgemeine Notizen</p>}
            {changes.mood && (
              <p>• Stimmung: {MOOD_EMOJIS[changes.mood]} {MOOD_LABELS[changes.mood]}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Abbrechen</Button>
            <Button onClick={completeSession} disabled={completing}>
              {completing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Speichern & Abschließen
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        onConfirm={() => { setShowCancelConfirm(false); setStarted(false) }}
        onCancel={() => setShowCancelConfirm(false)}
        title="Jour Fixe abbrechen?"
        message={`${totalChanges} ungespeicherte Änderung${totalChanges !== 1 ? 'en' : ''} gehen verloren.`}
        confirmLabel="Verwerfen"
        variant="danger"
      />

      {/* Navigation Blocker Dialog */}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
        title="Jour Fixe verlassen?"
        message={`${totalChanges} ungespeicherte Änderung${totalChanges !== 1 ? 'en' : ''}. Die Session bleibt offen und kann fortgesetzt werden.`}
        confirmLabel="Trotzdem verlassen"
        variant="danger"
      />

      {showTour && (
        <OnboardingTour
          steps={JOURFIX_TOUR}
          tourKey="teamlead-tour-jourfix"
          onDone={() => setShowTour(false)}
        />
      )}
    </div>
  )
}
