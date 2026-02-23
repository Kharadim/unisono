from pydantic import BaseModel
from typing import Optional


# --- Employees ---
class EmployeeCreate(BaseModel):
    name: str
    role: str = ""
    department: str = ""
    responsibilities: str = ""
    start_date: Optional[str] = None
    birthday: Optional[str] = None
    personal_notes: str = ""

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    responsibilities: Optional[str] = None
    start_date: Optional[str] = None
    birthday: Optional[str] = None
    personal_notes: Optional[str] = None


# --- Projects ---
class ProjectCreate(BaseModel):
    name: str
    scope: str = ""
    status: str = "aktiv"
    status_text: str = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    scope: Optional[str] = None
    status: Optional[str] = None
    status_text: Optional[str] = None

class ProjectMember(BaseModel):
    employee_id: int
    role_in_project: str = ""


# --- Milestones ---
class MilestoneCreate(BaseModel):
    name: str
    status: str = "offen"
    due_date: Optional[str] = None
    sort_order: int = 0

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    sort_order: Optional[int] = None


# --- KPIs ---
class KPICreate(BaseModel):
    label: str
    value: str = ""
    unit: str = ""
    sort_order: int = 0

class KPIUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    unit: Optional[str] = None
    sort_order: Optional[int] = None


# --- Notes ---
class NoteCreate(BaseModel):
    content: str
    type: str = "general"
    date: Optional[str] = None
    tags: str = ""

class NoteUpdate(BaseModel):
    content: str
    tags: Optional[str] = None


# --- Reorder ---
class ReorderRequest(BaseModel):
    ordered_ids: list[int]


# --- JF Agenda ---
class AgendaItemCreate(BaseModel):
    content: str
    project_id: Optional[int] = None


# --- Agreements ---
class AgreementCreate(BaseModel):
    content: str
    project_id: Optional[int] = None
    due_date: Optional[str] = None
    jourfix_id: Optional[int] = None

class AgreementUpdate(BaseModel):
    content: Optional[str] = None
    project_id: Optional[int] = None
    due_date: Optional[str] = None


# --- Goals ---
class GoalCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "fachlich"
    due_date: Optional[str] = None
    period: str = "2026"

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    period: Optional[str] = None


# --- Tags ---
class TagCreate(BaseModel):
    name: str
    color: str = "blue"

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


# --- Jour Fixe ---
class JourFixComplete(BaseModel):
    general_notes: str = ""
    general_notes_tags: str = ""
    project_notes: list[dict] = []  # [{project_id, notes, tags?}]
    milestone_changes: list[dict] = []  # [{id, status?, name?, due_date?}]
    kpi_changes: list[dict] = []  # [{id, value, unit?}]
    project_status_changes: list[dict] = []  # [{project_id, status?, status_text?}]
    new_milestones: list[dict] = []  # [{project_id, name, due_date?, status?}]
    new_kpis: list[dict] = []  # [{project_id, label, value, unit?}]
    new_agreements: list[dict] = []  # [{content, project_id?, due_date?}]
    goal_changes: list[dict] = []  # [{id, status}]
    agreement_changes: list[dict] = []  # [{id, status}]
    measure_changes: list[dict] = []  # [{id, status}]
    training_changes: list[dict] = []  # [{id, status}]
    mood: Optional[int] = None  # 1-5


# --- Development Plans ---
class DevPlanCreate(BaseModel):
    period: str = "2026"
    summary: str = ""

class DevPlanUpdate(BaseModel):
    period: Optional[str] = None
    summary: Optional[str] = None
    reflexion_tasks: Optional[str] = None
    reflexion_successes: Optional[str] = None
    reflexion_challenges: Optional[str] = None
    reflexion_focus: Optional[str] = None
    performance_rating: Optional[str] = None
    change_interest: Optional[str] = None
    change_interest_details: Optional[str] = None
    talent_pool: Optional[str] = None
    mobility_willing: Optional[int] = None
    mobility_scope: Optional[str] = None
    mobility_locations: Optional[str] = None
    remarks: Optional[str] = None

class DevStrengthCreate(BaseModel):
    content: str

class DevStrengthUpdate(BaseModel):
    content: Optional[str] = None

class DevAreaCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "mittel"

class DevAreaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None

class DevMeasureCreate(BaseModel):
    content: str
    due_date: Optional[str] = None
    goal_id: Optional[int] = None

class DevMeasureUpdate(BaseModel):
    content: Optional[str] = None
    due_date: Optional[str] = None
    goal_id: Optional[int] = None


# --- Dev Trainings ---
class DevTrainingCreate(BaseModel):
    content: str
    provider: str = ""
    cost: str = ""
    due_date: Optional[str] = None

class DevTrainingUpdate(BaseModel):
    content: Optional[str] = None
    provider: Optional[str] = None
    cost: Optional[str] = None
    due_date: Optional[str] = None


# --- KI Settings ---
class KISettingsUpdate(BaseModel):
    provider: str = "ollama"  # ollama, openai, anthropic
    endpoint: str = "http://localhost:11434"
    api_key: str = ""
    model: str = "llama3.2"
    enabled: bool = True


# --- Chat ---
class ChatRequest(BaseModel):
    message: str
    context_hint: str = ""  # e.g. "employee:3", "project:5", "dashboard"
    history: list[dict] = []  # [{role, content}]
