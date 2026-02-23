export interface Employee {
  id: number
  name: string
  role: string
  department: string
  responsibilities: string
  start_date: string | null
  photo_path: string | null
  birthday: string | null
  personal_notes: string
  created_at: string
  projects?: ProjectSummary[]
}

export interface ProjectSummary {
  id: number
  name: string
  status: string
  role_in_project: string
}

export interface Project {
  id: number
  name: string
  scope: string
  status: 'aktiv' | 'pausiert' | 'abgeschlossen'
  status_text: string
  created_at: string
  members: ProjectMember[]
  milestones: Milestone[]
  kpis: KPI[]
  milestone_total?: number
  milestone_done?: number
  milestone_overdue?: number
  jourfix_notes?: JourFixProjectNote[]
  agreements?: Agreement[]
}

export interface ProjectMember {
  id: number
  name: string
  role: string
  photo_path: string | null
  role_in_project: string
}

export interface Milestone {
  id: number
  project_id: number
  name: string
  status: 'offen' | 'in_arbeit' | 'done'
  due_date: string | null
  completed_at: string | null
  sort_order: number
}

export interface KPI {
  id: number
  project_id: number
  label: string
  value: string
  unit: string
  sort_order: number
}

export interface Note {
  id: number
  employee_id: number
  date: string
  content: string
  type: 'general' | 'jourfix'
  jourfix_id: number | null
  tags: string
  created_at: string
}

export interface StatusHistoryEntry {
  id: number
  project_id: number
  field: string
  old_value: string
  new_value: string
  changed_at: string
}

export interface AgendaItem {
  id: number
  employee_id: number
  project_id: number | null
  project_name: string | null
  content: string
  created_at: string
  discussed_at: string | null
}

export interface JourFixSession {
  id: number
  employee_id: number
  started_at: string
  completed_at: string | null
  general_notes: string
  mood: number | null
  project_notes?: JourFixProjectNote[]
}

export interface JourFixProjectNote {
  id: number
  jourfix_id: number
  project_id: number
  project_name: string
  notes: string
  tags: string
}

export interface JourFixStartResponse {
  session_id: number
  employee_id: number
  projects: Project[]
  goals: Goal[]
  agreements: Agreement[]
  devplan: DevPlan | null
}

export interface KPIHistoryEntry {
  id: number
  kpi_id: number
  old_value: string
  old_unit: string
  new_value: string
  new_unit: string
  changed_at: string
}

export interface Agreement {
  id: number
  employee_id: number
  project_id: number | null
  project_name: string | null
  content: string
  status: 'offen' | 'erledigt'
  due_date: string | null
  created_at: string
  completed_at: string | null
  jourfix_id: number | null
}

export interface Goal {
  id: number
  employee_id: number
  title: string
  description: string
  status: 'offen' | 'in_arbeit' | 'erreicht' | 'nicht_erreicht'
  category: 'fachlich' | 'persoenlich' | 'fuehrung'
  due_date: string | null
  created_at: string
  completed_at: string | null
  period: string
}

export interface TagDefinition {
  id: number
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface OverdueAgreementDetail {
  id: number
  employee_id: number
  employee_name: string
  content: string
  due_date: string
  project_id: number | null
  project_name: string | null
}

export interface DashboardStats {
  last_jf_per_employee: Record<string, { last_jf: string; mood: number | null }>
  overdue_agreements: number
  overdue_agreement_details: OverdueAgreementDetail[]
  open_agreements: number
}

export interface AttentionItem {
  employee_id: number
  employee_name: string
  photo_path: string | null
  score: number
  signals: string[]
}

export interface DevPlan {
  id: number
  employee_id: number
  period: string
  summary: string
  reflexion_tasks: string
  reflexion_successes: string
  reflexion_challenges: string
  reflexion_focus: string
  performance_rating: string
  change_interest: string
  change_interest_details: string
  talent_pool: string
  mobility_willing: number | null
  mobility_scope: string
  mobility_locations: string
  remarks: string
  created_at: string
  updated_at: string
  strengths: DevStrength[]
  areas: DevArea[]
  trainings: DevTraining[]
}

export interface DevTraining {
  id: number
  plan_id: number
  content: string
  status: 'vorgeschlagen' | 'genehmigt' | 'abgeschlossen'
  provider: string
  cost: string
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
}

export interface DevStrength {
  id: number
  plan_id: number
  content: string
  sort_order: number
  created_at: string
}

export interface DevArea {
  id: number
  plan_id: number
  title: string
  description: string
  priority: 'hoch' | 'mittel' | 'niedrig'
  sort_order: number
  created_at: string
  measures: DevMeasure[]
}

export interface DevMeasure {
  id: number
  area_id: number
  content: string
  status: 'offen' | 'in_arbeit' | 'erledigt'
  due_date: string | null
  completed_at: string | null
  goal_id: number | null
  created_at: string
}

export interface KISettings {
  provider: string
  endpoint: string
  api_key: string
  api_key_set: boolean
  model: string
  enabled: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  response: string | null
  error: string | null
  message?: string
}
