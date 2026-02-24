import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { OnboardingTour } from '@/components/tour/OnboardingTour'
import type { TourStep } from '@/components/tour/OnboardingTour'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { statusColor, statusLabel, daysAgo, formatDate, cn, getNextAnniversary } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading'
import { Users, FolderKanban, AlertTriangle, CheckCircle2, Clock, ChevronDown, Building2, Handshake, Info, Sparkles, BarChart3, Radar, Rocket } from 'lucide-react'
import type { Employee, Project, DashboardStats, AttentionItem } from '@/types'

const DASHBOARD_TOUR: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Willkommen bei Unisono!',
    description: 'In 5 kurzen Schritten zeige ich dir die wichtigsten Funktionen.',
    icon: Sparkles,
  },
  {
    id: 'team',
    target: 'tour-team',
    title: 'Dein Team',
    description: 'Hier findest du dein Team. Klicke auf \'+\' um Mitarbeiter anzulegen — mit Rolle, Abteilung und Foto.',
    icon: Users,
    position: 'right',
  },
  {
    id: 'projekte',
    target: 'tour-projekte',
    title: 'Projekte verwalten',
    description: 'Erstelle Projekte auf der Mitarbeiter-Seite und tracke Milestones, KPIs und Statusaenderungen.',
    icon: FolderKanban,
    position: 'right',
  },
  {
    id: 'stats',
    target: 'tour-stats',
    title: 'Alles auf einen Blick',
    description: 'Dein Dashboard zeigt Teamgroesse, aktive Projekte, Milestone-Fortschritt und ueberfaellige Aufgaben.',
    icon: BarChart3,
    position: 'bottom',
  },
  {
    id: 'radar',
    target: 'tour-radar',
    title: 'Aufmerksamkeits-Radar',
    description: 'Das Radar zeigt dir, welche Mitarbeiter gerade besondere Aufmerksamkeit brauchen — basierend auf JF-Disziplin, Stimmung und offenen Aufgaben.',
    icon: Radar,
    position: 'bottom',
  },
  {
    id: 'done',
    target: null,
    title: 'Bereit? Los geht\'s!',
    description: 'Lege jetzt deinen ersten Mitarbeiter an. Tipp: Starte woechentliche Jour Fixes fuer strukturierte 1:1-Gespraeche.',
    icon: Rocket,
  },
]

interface DepartmentProjects {
  name: string
  active: Project[]
  completed: Project[]
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const [showCompleted, setShowCompleted] = useState<Record<string, boolean>>({})
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({})
  const [showTour, setShowTour] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  const { data: demoStatus } = useQuery({
    queryKey: ['demo-status'],
    queryFn: api.getDemoDataStatus,
  })

  // Show welcome modal when DB is empty and not dismissed, OR start tour
  useEffect(() => {
    if (!demoStatus) return
    if (demoStatus.isEmpty && !demoStatus.welcomeDismissed) {
      setShowWelcome(true)
    } else if (!demoStatus.isEmpty && !localStorage.getItem('teamlead-tour-dashboard')) {
      setShowTour(true)
    }
  }, [demoStatus])

  const handleWelcomeDone = useCallback(async (loadedDemo: boolean) => {
    if (!loadedDemo) {
      await api.dismissWelcome()
    }
    setShowWelcome(false)
    queryClient.invalidateQueries({ queryKey: ['demo-status'] })
    if (loadedDemo && !localStorage.getItem('teamlead-tour-dashboard')) {
      // Start tour only if it was never completed before
      setShowTour(true)
    }
  }, [queryClient])

  // Listen for tour-reset event from Sidebar "Tour starten"
  useEffect(() => {
    const handler = () => setShowTour(true)
    window.addEventListener('tour-reset', handler)
    return () => window.removeEventListener('tour-reset', handler)
  }, [])

  const { data: employees = [], isLoading: loadingEmp } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: api.getEmployees,
  })

  const { data: projects = [], isLoading: loadingProj } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  })

  const { data: dashStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  })

  const { data: attentionItems = [] } = useQuery<AttentionItem[]>({
    queryKey: ['attention-radar'],
    queryFn: api.getAttentionRadar,
  })

  if (loadingEmp && loadingProj) return <LoadingSpinner />

  const activeProjects = projects.filter(p => p.status !== 'abgeschlossen')
  const totalMilestones = projects.reduce((sum, p) => sum + (p.milestone_total ?? 0), 0)
  const doneMilestones = projects.reduce((sum, p) => sum + (p.milestone_done ?? 0), 0)
  const overdueMilestones = projects.reduce((sum, p) => sum + (p.milestone_overdue ?? 0), 0)
  const overdueAgreements = dashStats?.overdue_agreements ?? 0

  // Birthday badges (next 14 days) — Map for quick lookup in team bubbles
  const birthdayMap = new Map<number, { daysUntil: number; label: string }>()
  for (const e of employees) {
    if (!e.birthday) continue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [, m, d] = e.birthday.split('-').map(Number)
    const nextBday = new Date(today.getFullYear(), m - 1, d)
    if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1)
    const daysUntil = Math.round((nextBday.getTime() - today.getTime()) / 86400000)
    if (daysUntil <= 14) {
      const label = daysUntil === 0 ? 'Heute!' : daysUntil === 1 ? 'Morgen' : `In ${daysUntil}d`
      birthdayMap.set(e.id, { daysUntil, label })
    }
  }

  // Anniversary badges (next 30 days) — Map for quick lookup in team bubbles
  const anniversaryMap = new Map<number, { years: number; daysUntil: number; label: string }>()
  for (const e of employees) {
    const anniv = getNextAnniversary(e.start_date)
    if (anniv && anniv.daysUntil <= 30) {
      const label = anniv.daysUntil === 0
        ? `${anniv.years} ${anniv.years === 1 ? 'Jahr' : 'Jahre'} — Heute!`
        : `${anniv.years}J — In ${anniv.daysUntil}d`
      anniversaryMap.set(e.id, { ...anniv, label })
    }
  }

  // Build department → projects structure (no employee layer)
  const departments: DepartmentProjects[] = (() => {
    // Map each project to its departments (via members)
    const deptMap = new Map<string, { activeSet: Map<number, Project>; completedSet: Map<number, Project> }>()

    for (const proj of projects) {
      for (const member of (proj.members || [])) {
        const emp = employees.find(e => e.id === member.id)
        const dept = emp?.department || 'Ohne Abteilung'
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { activeSet: new Map(), completedSet: new Map() })
        }
        const bucket = deptMap.get(dept)!
        if (proj.status === 'abgeschlossen') {
          bucket.completedSet.set(proj.id, proj)
        } else {
          bucket.activeSet.set(proj.id, proj)
        }
      }
    }

    return Array.from(deptMap.entries())
      .map(([name, { activeSet, completedSet }]) => ({
        name,
        active: Array.from(activeSet.values()),
        completed: Array.from(completedSet.values()),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()

  const toggleDept = (dept: string) => {
    setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }))
  }

  const toggleCompleted = (key: string) => {
    setShowCompleted(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // JF discipline helper
  const getJfIndicator = (empId: number) => {
    if (!dashStats) return null
    const data = dashStats.last_jf_per_employee[String(empId)]
    if (!data) return { color: 'text-gray-400', label: 'Noch kein JF', days: null }
    const days = daysAgo(data.last_jf)
    if (days === null) return null
    if (days > 28) return { color: 'text-red-500', label: `${days}d`, days }
    if (days > 14) return { color: 'text-yellow-600', label: `${days}d`, days }
    return null // <= 14 days is fine, no indicator needed
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Stats */}
      <div data-tour="tour-stats" className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="hover:shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <FolderKanban className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProjects.length}</p>
                <p className="text-sm text-muted-foreground">Aktive Projekte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {doneMilestones}/{totalMilestones}
                </p>
                <p className="text-sm text-muted-foreground">Milestones erledigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${overdueMilestones > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${overdueMilestones > 0 ? 'text-red-700' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueMilestones}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="relative group">
          <Card className={cn('hover:shadow-sm', overdueAgreements > 0 && 'cursor-pointer')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${overdueAgreements > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Handshake className={`h-5 w-5 ${overdueAgreements > 0 ? 'text-orange-700' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueAgreements}</p>
                  <p className="text-sm text-muted-foreground">Vereinb. überfällig</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {overdueAgreements > 0 && (dashStats?.overdue_agreement_details ?? []).length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Card className="shadow-lg border">
                <CardContent className="p-3 space-y-2 max-h-64 overflow-auto">
                  {dashStats!.overdue_agreement_details.map(a => (
                    <Link
                      key={a.id}
                      to={`/employees/${a.employee_id}`}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.employee_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.content}</p>
                      </div>
                      <span className="text-xs text-destructive whitespace-nowrap flex-shrink-0">
                        Fällig {formatDate(a.due_date)}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mein Team — Bubbles */}
      {employees.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Mein Team</h2>
          <div className="flex flex-wrap gap-3">
            {employees.map(emp => {
              const bday = birthdayMap.get(emp.id)
              const anniv = anniversaryMap.get(emp.id)
              const jf = getJfIndicator(emp.id)

              return (
                <Link key={emp.id} to={`/employees/${emp.id}`}>
                  <div className="flex flex-col items-center p-4 rounded-xl border bg-card hover:shadow-md transition-all w-36 h-48 text-center">
                    <Avatar src={emp.photo_path} name={emp.name} size="lg" />
                    <p className="font-medium text-sm mt-2 truncate w-full">{emp.name}</p>
                    {emp.role && (
                      <p className="text-xs text-gray-500 truncate w-full">{emp.role}</p>
                    )}
                    <div className="flex flex-col gap-1 mt-auto w-full">
                      {bday && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                          🎂 {bday.label}
                        </span>
                      )}
                      {anniv && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          🎉 {anniv.label}
                        </span>
                      )}
                      {jf && (
                        <span className={cn('text-xs flex items-center justify-center gap-0.5', jf.color)}>
                          <Clock className="h-3 w-3" />
                          {jf.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Aufmerksamkeits-Radar */}
      {attentionItems.length > 0 && (
        <div data-tour="tour-radar" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aufmerksamkeit</p>
            <div className="relative group/info">
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-150 z-50 pointer-events-none">
                <div className="bg-foreground text-background text-xs rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-1.5">Aufmerksamkeits-Score</p>
                  <p className="mb-1.5 text-background/80">Je hoeher der Score, desto dringender ist ein Gespraech mit dem Mitarbeiter.</p>
                  <ul className="space-y-0.5 text-background/70">
                    <li>+5 — Noch nie ein JF gehabt</li>
                    <li>+4 — Kein JF seit &gt;28 Tagen</li>
                    <li>+2 — Kein JF seit &gt;14 Tagen</li>
                    <li>+3 — Schlechte Stimmung (1-2)</li>
                    <li>+2 — Stimmung sinkt seit 3 JFs</li>
                    <li>+2 — Pro ueberfaelliger Vereinbarung</li>
                    <li>+1 — Pro ueberfaelligem Milestone</li>
                    <li>+1 — Kein Entwicklungsplan</li>
                    <li>+1 — STEPs-Gespräch offen</li>
                    <li>+1 — Pro ueberfaelliger Massnahme</li>
                  </ul>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-foreground rotate-45" />
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {attentionItems.map(item => (
                  <Link
                    key={item.employee_id}
                    to={`/employees/${item.employee_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar src={item.photo_path} name={item.employee_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.employee_name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.signals.map((signal, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Badge className={cn(
                      'text-xs font-bold',
                      item.score >= 7 ? 'bg-red-100 text-red-700' :
                      item.score >= 4 ? 'bg-amber-100 text-amber-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {item.score}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects by Department */}
      {departments.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Projekte</p>
          <div className="space-y-4">
            {departments.map(dept => {
              const isCollapsed = collapsedDepts[dept.name]
              const compKey = `dept-${dept.name}`

              return (
                <Card key={dept.name} className="hover:shadow-sm overflow-hidden">
                  {/* Department Header */}
                  <button
                    onClick={() => toggleDept(dept.name)}
                    className="flex items-center gap-2.5 px-5 py-3 w-full bg-muted/50 border-b hover:bg-muted/70 transition-colors"
                  >
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isCollapsed && '-rotate-90')} />
                    <Building2 className="h-4 w-4 text-primary/70" />
                    <span className="font-semibold">{dept.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {dept.active.length} aktiv{dept.completed.length > 0 ? ` · ${dept.completed.length} abgeschlossen` : ''}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y">
                      {/* Active Projects */}
                      {dept.active.map(proj => (
                        <Link key={proj.id} to={`/projects/${proj.id}`}>
                          <div className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors">
                            <span className={cn(
                              'h-2 w-2 rounded-full flex-shrink-0',
                              proj.status === 'aktiv' ? 'bg-emerald-500' : proj.status === 'pausiert' ? 'bg-amber-500' : 'bg-gray-400'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{proj.name}</p>
                              {proj.status_text && (
                                <p className="text-xs text-muted-foreground truncate">{proj.status_text}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Member Avatars */}
                              {(proj.members || []).length > 0 && (
                                <div className="flex -space-x-2">
                                  {proj.members.slice(0, 4).map(m => (
                                    <Avatar
                                      key={m.id}
                                      src={m.photo_path}
                                      name={m.name}
                                      size="sm"
                                      className="ring-2 ring-background h-6 w-6 text-[10px]"
                                    />
                                  ))}
                                  {proj.members.length > 4 && (
                                    <div className="h-6 w-6 rounded-full bg-muted text-[10px] flex items-center justify-center ring-2 ring-background font-medium">
                                      +{proj.members.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                              {(proj.milestone_overdue ?? 0) > 0 && (
                                <span className="text-xs text-destructive flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />{proj.milestone_overdue}
                                </span>
                              )}
                              {(proj.milestone_total ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${((proj.milestone_done ?? 0) / (proj.milestone_total ?? 1)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {proj.milestone_done ?? 0}/{proj.milestone_total ?? 0}
                                  </span>
                                </div>
                              )}
                              <Badge className={cn(statusColor(proj.status), 'text-xs')}>
                                {statusLabel(proj.status)}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* Completed Projects (collapsible per department) */}
                      {dept.completed.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleCompleted(compKey)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-5 py-2"
                          >
                            <ChevronDown className={cn('h-3 w-3 transition-transform', !showCompleted[compKey] && '-rotate-90')} />
                            {dept.completed.length} abgeschlossen
                          </button>
                          {showCompleted[compKey] && (
                            <div className="divide-y">
                              {dept.completed.map(proj => (
                                <Link key={proj.id} to={`/projects/${proj.id}`}>
                                  <div className="flex items-center gap-3 px-5 py-3 opacity-60 hover:opacity-80 transition-opacity">
                                    <span className="h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{proj.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {(proj.members || []).length > 0 && (
                                        <div className="flex -space-x-2">
                                          {proj.members.slice(0, 4).map(m => (
                                            <Avatar
                                              key={m.id}
                                              src={m.photo_path}
                                              name={m.name}
                                              size="sm"
                                              className="ring-2 ring-background h-6 w-6 text-[10px]"
                                            />
                                          ))}
                                        </div>
                                      )}
                                      <Badge className={cn(statusColor(proj.status), 'text-xs')}>
                                        {statusLabel(proj.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {dept.active.length === 0 && dept.completed.length === 0 && (
                        <p className="text-xs text-muted-foreground px-5 py-3">Keine Projekte</p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Keine Projekte"
          description="Erstelle ein Projekt auf der Mitarbeiter-Seite, um loszulegen."
        />
      )}

      {showTour && (
        <OnboardingTour
          steps={DASHBOARD_TOUR}
          tourKey="teamlead-tour-dashboard"
          onDone={() => setShowTour(false)}
        />
      )}

      {showWelcome && <WelcomeModal onDone={handleWelcomeDone} />}
    </div>
  )
}
