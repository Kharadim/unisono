// Detect Tauri environment and resolve backend base URL
function getBase(): string {
  const w = window as any
  if (w.__TAURI__ || w.__TAURI_INTERNALS__) {
    const port = w.__UNISONO_PORT__ || 8001
    return `http://localhost:${port}/api`
  }
  return '/api'
}

const TOKEN_KEY = 'teamlead_auth_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Build full photo URL (for Avatar component) */
export function getPhotoUrl(filename: string): string {
  return `${getBase()}/photos/${filename}`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${getBase()}${path}`, {
    ...options,
    headers,
  })
  if (res.status === 204) return undefined as T
  if (res.status === 401) {
    clearAuthToken()
    window.location.reload()
    throw new Error('Sitzung abgelaufen')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  getAuthStatus: () => request<{ has_password: boolean; token_valid: boolean }>('/auth/status'),
  setupPassword: (password: string) => request<{ token: string }>('/auth/setup', { method: 'POST', body: JSON.stringify({ password }) }),
  login: (password: string) => request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  changePassword: (old_password: string, new_password: string) => request<{ token: string }>('/auth/change-password', { method: 'PUT', body: JSON.stringify({ old_password, new_password }) }),

  // Employees
  getEmployees: () => request<any[]>('/employees'),
  getEmployee: (id: number) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) => request<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = getAuthToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${getBase()}/employees/${id}/photo`, { method: 'POST', body: form, headers }).then(r => {
      if (r.status === 401) { clearAuthToken(); window.location.reload(); throw new Error('Sitzung abgelaufen') }
      if (!r.ok) throw new Error('Nur JPG, PNG und WebP werden unterstuetzt.')
      return r.json()
    })
  },

  // Projects
  getProjects: () => request<any[]>('/projects'),
  getProject: (id: number) => request<any>(`/projects/${id}`),
  createProject: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (projectId: number, data: any) => request<any>(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (projectId: number, employeeId: number, role: string) => request<any>(`/projects/${projectId}/members/${employeeId}`, { method: 'PUT', body: JSON.stringify({ employee_id: employeeId, role_in_project: role }) }),
  removeMember: (projectId: number, employeeId: number) => request<void>(`/projects/${projectId}/members/${employeeId}`, { method: 'DELETE' }),
  getProjectHistory: (id: number) => request<any[]>(`/projects/${id}/history`),

  // Milestones
  createMilestone: (projectId: number, data: any) => request<any>(`/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (id: number, data: any) => request<any>(`/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMilestone: (id: number) => request<void>(`/milestones/${id}`, { method: 'DELETE' }),
  toggleMilestone: (id: number) => request<any>(`/milestones/${id}/toggle`, { method: 'PATCH' }),
  reorderMilestones: (projectId: number, orderedIds: number[]) =>
    request<any[]>(`/projects/${projectId}/milestones/reorder`, { method: 'PATCH', body: JSON.stringify({ ordered_ids: orderedIds }) }),

  // KPIs
  createKPI: (projectId: number, data: any) => request<any>(`/projects/${projectId}/kpis`, { method: 'POST', body: JSON.stringify(data) }),
  updateKPI: (id: number, data: any) => request<any>(`/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKPI: (id: number) => request<void>(`/kpis/${id}`, { method: 'DELETE' }),
  getKPIHistory: (id: number) => request<any[]>(`/kpis/${id}/history`),
  reorderKPIs: (projectId: number, orderedIds: number[]) =>
    request<any[]>(`/projects/${projectId}/kpis/reorder`, { method: 'PATCH', body: JSON.stringify({ ordered_ids: orderedIds }) }),

  // Notes
  getNotes: (employeeId: number) => request<any[]>(`/employees/${employeeId}/notes`),
  createNote: (employeeId: number, data: any) => request<any>(`/employees/${employeeId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: number, data: { content: string; tags?: string }) => request<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),

  // Agenda
  getAgenda: (employeeId: number) => request<any[]>(`/employees/${employeeId}/agenda`),
  createAgendaItem: (employeeId: number, data: any) => request<any>(`/employees/${employeeId}/agenda`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAgendaItem: (id: number) => request<void>(`/employees/agenda/${id}`, { method: 'DELETE' }),
  markAgendaDiscussed: (id: number) => request<any>(`/employees/agenda/${id}/discuss`, { method: 'PATCH' }),

  // Jour Fixe
  startJourfix: (employeeId: number) => request<any>(`/employees/${employeeId}/jourfix`, { method: 'POST' }),
  getOpenJourfix: (employeeId: number) => request<any>(`/employees/${employeeId}/jourfix/open`),
  completeJourfix: (sessionId: number, data: any) => request<any>(`/jourfix/${sessionId}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  resumeJourfix: (sessionId: number) => request<any>(`/jourfix/${sessionId}/resume`, { method: 'POST' }),
  discardJourfix: (sessionId: number) => request<void>(`/jourfix/${sessionId}`, { method: 'DELETE' }),
  getJourfixHistory: (employeeId: number) => request<any[]>(`/employees/${employeeId}/jourfix-history`),
  getJourfixRecap: (employeeId: number) => request<any>(`/employees/${employeeId}/jourfix/recap`),
  getJourfixBriefing: (employeeId: number) => request<any>(`/employees/${employeeId}/jourfix/briefing`, { method: 'POST' }),

  // Agreements
  getAgreements: (employeeId: number) => request<any[]>(`/employees/${employeeId}/agreements`),
  createAgreement: (employeeId: number, data: any) => request<any>(`/employees/${employeeId}/agreements`, { method: 'POST', body: JSON.stringify(data) }),
  updateAgreement: (id: number, data: any) => request<any>(`/agreements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAgreement: (id: number) => request<any>(`/agreements/${id}/toggle`, { method: 'PATCH' }),
  deleteAgreement: (id: number) => request<void>(`/agreements/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: (employeeId: number) => request<any[]>(`/employees/${employeeId}/goals`),
  createGoal: (employeeId: number, data: any) => request<any>(`/employees/${employeeId}/goals`, { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: number, data: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleGoal: (id: number) => request<any>(`/goals/${id}/toggle`, { method: 'PATCH' }),
  setGoalStatus: (id: number, status: string) => request<any>(`/goals/${id}/set-status?status=${status}`, { method: 'PATCH' }),
  deleteGoal: (id: number) => request<void>(`/goals/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: () => request<any[]>('/tags'),
  createTag: (data: any) => request<any>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id: number, data: any) => request<any>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTag: (id: number) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  reorderTags: (orderedIds: number[]) => request<any[]>('/tags/reorder', { method: 'PATCH', body: JSON.stringify({ ordered_ids: orderedIds }) }),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),
  getAttentionRadar: () => request<any[]>('/dashboard/attention'),

  // JF Protocol
  getJourfixProtocol: (sessionId: number) => request<any>(`/jourfix/${sessionId}/protocol`),

  // KI Settings
  getKISettings: () => request<any>('/settings/ki'),
  updateKISettings: (data: any) => request<any>('/settings/ki', { method: 'PUT', body: JSON.stringify(data) }),
  testKIConnection: () => request<any>('/settings/ki/test', { method: 'POST' }),

  // Chat
  sendChatMessage: (data: { message: string; context_hint: string; history: any[] }) =>
    request<any>('/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Development Plans
  getDevPlans: (employeeId: number) => request<any[]>(`/employees/${employeeId}/devplan`),
  createDevPlan: (employeeId: number, data: any) => request<any>(`/employees/${employeeId}/devplan`, { method: 'POST', body: JSON.stringify(data) }),
  updateDevPlan: (planId: number, data: any) => request<any>(`/devplan/${planId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevPlan: (planId: number) => request<void>(`/devplan/${planId}`, { method: 'DELETE' }),

  createDevStrength: (planId: number, data: any) => request<any>(`/devplan/${planId}/strengths`, { method: 'POST', body: JSON.stringify(data) }),
  updateDevStrength: (id: number, data: any) => request<any>(`/devplan/strengths/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevStrength: (id: number) => request<void>(`/devplan/strengths/${id}`, { method: 'DELETE' }),

  createDevArea: (planId: number, data: any) => request<any>(`/devplan/${planId}/areas`, { method: 'POST', body: JSON.stringify(data) }),
  updateDevArea: (id: number, data: any) => request<any>(`/devplan/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevArea: (id: number) => request<void>(`/devplan/areas/${id}`, { method: 'DELETE' }),

  createDevMeasure: (areaId: number, data: any) => request<any>(`/devplan/areas/${areaId}/measures`, { method: 'POST', body: JSON.stringify(data) }),
  updateDevMeasure: (id: number, data: any) => request<any>(`/devplan/measures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevMeasure: (id: number) => request<void>(`/devplan/measures/${id}`, { method: 'DELETE' }),
  toggleDevMeasure: (id: number) => request<any>(`/devplan/measures/${id}/toggle`, { method: 'PATCH' }),

  // Dev Trainings
  createDevTraining: (planId: number, data: any) => request<any>(`/devplan/${planId}/trainings`, { method: 'POST', body: JSON.stringify(data) }),
  updateDevTraining: (id: number, data: any) => request<any>(`/devplan/trainings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevTraining: (id: number) => request<void>(`/devplan/trainings/${id}`, { method: 'DELETE' }),
  toggleDevTraining: (id: number) => request<any>(`/devplan/trainings/${id}/toggle`, { method: 'PATCH' }),

  // Demo Data
  getDemoDataStatus: () => request<{ isEmpty: boolean; demoDataLoaded: boolean; welcomeDismissed: boolean }>('/demo-data/status'),
  loadDemoData: (template?: string) =>
    request<any>(`/demo-data/load${template ? `?template=${template}` : ''}`, { method: 'POST' }),
  deleteDemoData: () => request<any>('/demo-data', { method: 'DELETE' }),
  dismissWelcome: () => request<any>('/demo-data/dismiss-welcome', { method: 'POST' }),
}
