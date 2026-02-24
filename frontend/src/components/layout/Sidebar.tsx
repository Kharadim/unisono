import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, clearAuthToken, setAuthToken } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TagSettings } from '@/components/layout/TagSettings'
import { KISettings } from '@/components/layout/KISettings'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Handshake, LayoutDashboard, Users, FolderKanban, Plus, Search, Settings, Bot, Play, Trash2, Shield, LogOut, KeyRound, Eye, EyeOff, Database, UserPen } from 'lucide-react'
import type { Employee, Project } from '@/types'

interface SidebarProps {
  onNavigate?: () => void
  onStartTour?: () => void
}

export function Sidebar({ onNavigate, onStartTour }: SidebarProps) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showNewEmployee, setShowNewEmployee] = useState(false)
  const [showTagSettings, setShowTagSettings] = useState(false)
  const [showKISettings, setShowKISettings] = useState(false)
  const [showDeleteDemo, setShowDeleteDemo] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeName, setShowChangeName] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')

  // Change password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showPwFields, setShowPwFields] = useState(false)

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: api.getEmployees,
  })

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  })

  const { data: demoStatus } = useQuery({
    queryKey: ['demo-status'],
    queryFn: api.getDemoDataStatus,
  })

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateEmployee = async () => {
    if (!newName.trim()) return
    try {
      await api.createEmployee({ name: newName.trim(), role: newRole.trim() })
      setNewName('')
      setNewRole('')
      setShowNewEmployee(false)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    } catch (e) {
      alert('Fehler beim Anlegen: ' + (e as Error).message)
    }
  }

  const handleDeleteDemo = async () => {
    try {
      await api.deleteDemoData()
      setShowDeleteDemo(false)
      localStorage.removeItem('teamlead-username')
      localStorage.removeItem('teamlead-tour-dashboard')
      localStorage.removeItem('teamlead-tour-employee')
      localStorage.removeItem('teamlead-tour-jourfix')
      queryClient.invalidateQueries()
    } catch (e) {
      alert('Fehler: ' + (e as Error).message)
    }
  }

  const handleLoadDemo = async () => {
    try {
      await api.loadDemoData()
      queryClient.invalidateQueries()
    } catch (e) {
      alert('Fehler: ' + (e as Error).message)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // Ignore errors — we're logging out anyway
    }
    clearAuthToken()
    window.location.reload()
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      setPwError('Neues Passwort muss mindestens 4 Zeichen lang sein.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('Neue Passwoerter stimmen nicht ueberein.')
      return
    }
    setPwLoading(true)
    setPwError('')
    try {
      const result = await api.changePassword(oldPassword, newPassword)
      setAuthToken(result.token)
      setPwSuccess(true)
      setTimeout(() => {
        setShowChangePassword(false)
        setPwSuccess(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      }, 1500)
    } catch (e) {
      setPwError((e as Error).message || 'Fehler beim Aendern.')
    } finally {
      setPwLoading(false)
    }
  }

  const resetChangePasswordDialog = () => {
    setShowChangePassword(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setPwError('')
    setPwSuccess(false)
    setShowPwFields(false)
  }

  const handleLink = () => {
    onNavigate?.()
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="w-72 bg-sidebar-bg flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 mb-4" onClick={handleLink}>
          <div className="h-8 w-8 rounded-lg bg-sidebar-active flex items-center justify-center">
            <Handshake className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-white">Unisono</span>
        </Link>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-muted-foreground" />
          <input
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md text-sm bg-sidebar-muted border-0 text-sidebar-foreground placeholder:text-sidebar-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-active"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-3 space-y-6">
        {/* Dashboard Link */}
        <div>
          <Link
            to="/"
            onClick={handleLink}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-sidebar-active text-white'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Team */}
        <div data-tour="tour-team">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[11px] font-semibold text-sidebar-muted-foreground uppercase tracking-wider">
              <Users className="h-3 w-3 inline mr-1" />
              Team
            </span>
            <button
              onClick={() => setShowNewEmployee(true)}
              className="text-sidebar-muted-foreground hover:text-white transition-colors"
              title="Neuen Mitarbeiter anlegen"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {filteredEmployees.map(emp => (
              <Link
                key={emp.id}
                to={`/employees/${emp.id}`}
                onClick={handleLink}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive(`/employees/${emp.id}`)
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <Avatar
                  src={emp.photo_path}
                  name={emp.name}
                  size="sm"
                  className={isActive(`/employees/${emp.id}`) ? 'ring-2 ring-white/30' : ''}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{emp.name}</div>
                  {emp.role && (
                    <div className={`truncate text-xs ${
                      isActive(`/employees/${emp.id}`) ? 'text-white/70' : 'text-sidebar-muted-foreground'
                    }`}>{emp.role}</div>
                  )}
                </div>
              </Link>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="px-3 py-2 text-xs text-sidebar-muted-foreground">Keine Mitarbeiter</p>
            )}
          </div>
        </div>

        {/* Projects */}
        <div data-tour="tour-projekte">
          <div className="flex items-center px-3 mb-1.5">
            <span className="text-[11px] font-semibold text-sidebar-muted-foreground uppercase tracking-wider">
              <FolderKanban className="h-3 w-3 inline mr-1" />
              Projekte
            </span>
          </div>
          <div className="space-y-0.5">
            {filteredProjects.filter(p => p.status !== 'abgeschlossen').map(proj => {
              const hasOverdue = (proj.milestone_overdue ?? 0) > 0
              const active = isActive(`/projects/${proj.id}`)
              return (
                <Link
                  key={proj.id}
                  to={`/projects/${proj.id}`}
                  onClick={handleLink}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
                  }`}
                >
                  {hasOverdue && <span className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />}
                  <span className="truncate">{proj.name}</span>
                  {proj.status === 'pausiert' && (
                    <span className={`text-xs ml-auto ${active ? 'text-yellow-300' : 'text-yellow-500'}`}>||</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => setShowKISettings(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
        >
          <Bot className="h-4 w-4" />
          KI-Assistent
        </button>
        <button
          onClick={() => setShowTagSettings(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
        >
          <Settings className="h-4 w-4" />
          Tags verwalten
        </button>
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
        >
          <KeyRound className="h-4 w-4" />
          Passwort aendern
        </button>
        <button
          onClick={() => {
            setEditedUsername(localStorage.getItem('teamlead-username') || '')
            setShowChangeName(true)
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
        >
          <UserPen className="h-4 w-4" />
          Name aendern
        </button>
        <Link
          to="/datenschutz"
          onClick={handleLink}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full ${
            isActive('/datenschutz')
              ? 'bg-sidebar-active text-white'
              : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white'
          }`}
        >
          <Shield className="h-4 w-4" />
          Datenschutz
        </Link>
        {demoStatus?.demoDataLoaded && (
          <button
            onClick={() => setShowDeleteDemo(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full"
          >
            <Trash2 className="h-4 w-4" />
            Demo-Daten entfernen
          </button>
        )}
        {demoStatus?.isEmpty && !demoStatus?.demoDataLoaded && (
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors w-full"
          >
            <Database className="h-4 w-4" />
            Demo-Daten laden
          </button>
        )}
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
          >
            <Play className="h-4 w-4" />
            Tour starten
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>

      {/* KI Settings Dialog */}
      <KISettings open={showKISettings} onClose={() => setShowKISettings(false)} />

      {/* Tag Settings Dialog */}
      <TagSettings open={showTagSettings} onClose={() => setShowTagSettings(false)} />

      {/* Delete Demo Data Confirm */}
      <ConfirmDialog
        open={showDeleteDemo}
        onConfirm={handleDeleteDemo}
        onCancel={() => setShowDeleteDemo(false)}
        title="Demo-Daten entfernen"
        message="Alle Mitarbeiter, Projekte, Notizen und Jour Fixes werden unwiderruflich geloescht. Du kannst danach mit eigenen Daten neu starten."
        confirmLabel="Alles loeschen"
        variant="danger"
      />

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onClose={resetChangePasswordDialog}>
        <DialogHeader>
          <DialogTitle>Passwort aendern</DialogTitle>
        </DialogHeader>
        {pwSuccess ? (
          <div className="text-center py-4">
            <p className="text-sm text-green-600 font-medium">Passwort erfolgreich geaendert.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showPwFields ? 'text' : 'password'}
                placeholder="Aktuelles Passwort"
                value={oldPassword}
                onChange={e => { setOldPassword(e.target.value); setPwError('') }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPwFields(!showPwFields)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPwFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              type={showPwFields ? 'text' : 'password'}
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPwError('') }}
            />
            <Input
              type={showPwFields ? 'text' : 'password'}
              placeholder="Neues Passwort bestaetigen"
              value={confirmNewPassword}
              onChange={e => { setConfirmNewPassword(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
            />
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetChangePasswordDialog}>Abbrechen</Button>
              <Button
                onClick={handleChangePassword}
                disabled={pwLoading || !oldPassword || !newPassword || !confirmNewPassword}
              >
                {pwLoading ? 'Bitte warten...' : 'Aendern'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Change Name Dialog */}
      <Dialog open={showChangeName} onClose={() => setShowChangeName(false)}>
        <DialogHeader>
          <DialogTitle>Name aendern</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Dein Name"
            value={editedUsername}
            onChange={e => setEditedUsername(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && editedUsername.trim()) {
                localStorage.setItem('teamlead-username', editedUsername.trim())
                setShowChangeName(false)
              }
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowChangeName(false)}>Abbrechen</Button>
            <Button
              onClick={() => {
                localStorage.setItem('teamlead-username', editedUsername.trim())
                setShowChangeName(false)
              }}
              disabled={!editedUsername.trim()}
            >
              Speichern
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Quick Add Employee Dialog */}
      <Dialog open={showNewEmployee} onClose={() => setShowNewEmployee(false)}>
        <DialogHeader>
          <DialogTitle>Neuer Mitarbeiter</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateEmployee()}
            autoFocus
          />
          <Input
            placeholder="Rolle (optional)"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateEmployee()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewEmployee(false)}>Abbrechen</Button>
            <Button onClick={handleCreateEmployee} disabled={!newName.trim()}>Anlegen</Button>
          </div>
        </div>
      </Dialog>
    </aside>
  )
}
