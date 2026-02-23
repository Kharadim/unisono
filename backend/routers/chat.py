from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.schemas import ChatRequest
import requests

router = APIRouter(prefix="/api", tags=["chat"])

SYSTEM_PROMPT = """Du bist ein KI-Assistent fuer einen Teamlead im Performance Marketing. Du hilfst bei:
1. Fragen zu Team-Daten (Mitarbeiter, Projekte, Vereinbarungen, Stimmungen, Notizen)
2. Fuehrungsthemen (Feedback, Konfliktloesung, Coaching, Mitarbeiterentwicklung)
3. Meeting-Vorbereitung (JF-Themen, Gespraechsleitfaeden)
4. Planung und Beratung (Milestones vorschlagen, Projektplaene skizzieren, Gespraechsfragen formulieren)

GRENZEN: Beantworte KEINE Fragen die nichts mit Team, Fuehrung oder Arbeit zu tun haben (kein Wetter, keine Rezepte, keine Allgemeinwissen-Fragen). Antworte stattdessen kurz: "Das liegt ausserhalb meines Bereichs. Ich helfe dir gerne bei Fragen zu deinem Team, Projekten oder Fuehrungsthemen."

Antworte auf Deutsch, kurz und praxisnah. Verwende Markdown fuer Formatierung.

WICHTIG — Daten vs. Beratung:
- Wenn nach bestehenden Daten gefragt wird (Notizen, Vereinbarungen, KPIs): Nutze NUR die unten aufgefuehrten Team-Daten. Erfinde keine Fakten ueber bestehende Mitarbeiter oder Projekte.
- Wenn nach Vorschlaegen oder Planung gefragt wird (z.B. "Erstelle Milestones fuer ein neues Projekt", "Welche Fragen sollte ich stellen?", "Wie strukturiere ich dieses Projekt?"): Hilf aktiv und kreativ! Frage bei Bedarf nach Details (Projektziel, Zeitrahmen, Team). Du darfst und sollst dein Wissen einbringen.
- Wenn nach einer Gesamtzusammenfassung gefragt wird, beziehe alle Daten ein (Notizen, Vereinbarungen, Ziele, Stimmungen).

Aktuelle Team-Daten:
{context}"""


def _get_ki_settings(conn):
    rows = conn.execute(
        "SELECT key, value FROM settings WHERE key LIKE 'ki_%'"
    ).fetchall()
    result = {}
    for row in rows:
        short_key = row["key"].replace("ki_", "", 1)
        result[short_key] = row["value"]
    return result


def _collect_team_overview(conn):
    employees = conn.execute(
        "SELECT id, name, role, department FROM employees ORDER BY department, name"
    ).fetchall()
    if not employees:
        return "Noch keine Mitarbeiter angelegt."
    lines = ["Team-Uebersicht:"]
    for e in employees:
        dept = f"Abteilung {e['department']}" if e["department"] else "Keine Abteilung"
        role = f", {e['role']}" if e["role"] else ""
        lines.append(f"  - {e['name']}{role} ({dept})")
    return "\n".join(lines)


def _collect_employee_context(conn, employee_id):
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?", (employee_id,)
    ).fetchone()
    if not emp:
        return ""

    lines = [f"\nAktuelle Seite: Mitarbeiter {emp['name']}"]
    if emp["role"]:
        lines.append(f"Rolle: {emp['role']}")
    if emp["department"]:
        lines.append(f"Abteilung: {emp['department']}")
    if emp["responsibilities"]:
        lines.append(f"Verantwortlichkeiten: {emp['responsibilities']}")

    # Recent notes (last 10)
    notes = conn.execute(
        "SELECT date, content, tags, type FROM notes WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10",
        (employee_id,),
    ).fetchall()
    if notes:
        lines.append("\nLetzte Notizen zu diesem Mitarbeiter:")
        for n in notes:
            tag_info = f" [Tags: {n['tags']}]" if n["tags"] else ""
            source = " (aus Jour Fixe)" if n["type"] == "jourfix" else ""
            lines.append(f"  - {n['date']}{source}{tag_info}: {n['content'][:200]}")

    # JF project notes (last 10)
    jpn = conn.execute(
        """SELECT jpn.notes, p.name as project_name, js.started_at, jpn.tags
           FROM jourfix_project_notes jpn
           JOIN jourfix_sessions js ON js.id = jpn.jourfix_id
           JOIN projects p ON p.id = jpn.project_id
           WHERE js.employee_id = ? AND jpn.notes != ''
           ORDER BY js.started_at DESC LIMIT 10""",
        (employee_id,),
    ).fetchall()
    if jpn:
        lines.append("\nLetzte Jour-Fixe-Projektnotizen:")
        for n in jpn:
            tag_info = f" [Tags: {n['tags']}]" if n["tags"] else ""
            lines.append(f"  - {n['started_at'][:10]} [{n['project_name']}]{tag_info}: {n['notes'][:200]}")

    # Open agreements
    agreements = conn.execute(
        "SELECT content, due_date, status FROM agreements WHERE employee_id = ? AND status = 'offen' ORDER BY created_at DESC",
        (employee_id,),
    ).fetchall()
    if agreements:
        lines.append("\nOffene Vereinbarungen:")
        for a in agreements:
            due = f" (faellig: {a['due_date']})" if a["due_date"] else ""
            lines.append(f"  - {a['content']}{due}")

    # Goals
    goals = conn.execute(
        "SELECT title, status, category FROM goals WHERE employee_id = ? ORDER BY created_at DESC",
        (employee_id,),
    ).fetchall()
    if goals:
        lines.append("\nZiele:")
        for g in goals:
            lines.append(f"  - [{g['status']}] {g['title']} ({g['category']})")

    # Development plans
    devplans = conn.execute(
        "SELECT * FROM development_plans WHERE employee_id = ? ORDER BY period DESC",
        (employee_id,),
    ).fetchall()
    if devplans:
        lines.append("\nEntwicklungsplaene:")
        for dp in devplans:
            lines.append(f"  Plan {dp['period']}:")
            if dp["summary"]:
                lines.append(f"    Zusammenfassung: {dp['summary'][:200]}")
            strengths = conn.execute(
                "SELECT content FROM dev_strengths WHERE plan_id = ? ORDER BY sort_order", (dp["id"],)
            ).fetchall()
            if strengths:
                lines.append("    Staerken: " + ", ".join(s["content"] for s in strengths))
            areas = conn.execute(
                "SELECT id, title, priority FROM dev_areas WHERE plan_id = ? ORDER BY sort_order", (dp["id"],)
            ).fetchall()
            for a in areas:
                measures = conn.execute(
                    "SELECT content, status, due_date FROM dev_measures WHERE area_id = ? ORDER BY created_at",
                    (a["id"],),
                ).fetchall()
                measure_info = ", ".join(
                    f"{m['content']} [{m['status']}]" + (f" (faellig: {m['due_date']})" if m["due_date"] else "")
                    for m in measures
                )
                lines.append(f"    Entwicklungsfeld '{a['title']}' ({a['priority']}): {measure_info or 'keine Massnahmen'}")

            # STEPs data
            rating_labels = {'uebertroffen': 'Uebertroffen', 'voll': 'Voll erfuellt', 'teilweise': 'Teilweise erfuellt', 'unzureichend': 'Unzureichend'}
            talent_labels = {'vertikal': 'Vertikal', 'horizontal': 'Horizontal', 'kein_wert': 'Kein Wert'}
            if dp["performance_rating"]:
                lines.append(f"    Leistungseinschaetzung: {rating_labels.get(dp['performance_rating'], dp['performance_rating'])}")
            if dp["talent_pool"]:
                lines.append(f"    Talent Pool: {talent_labels.get(dp['talent_pool'], dp['talent_pool'])}")

            # Trainings
            trainings = conn.execute(
                "SELECT content, status, provider, cost FROM dev_trainings WHERE plan_id = ? ORDER BY sort_order",
                (dp["id"],),
            ).fetchall()
            if trainings:
                training_info = ", ".join(
                    f"{t['content']} [{t['status']}]" + (f" ({t['provider']})" if t["provider"] else "")
                    for t in trainings
                )
                lines.append(f"    Weiterbildungen: {training_info}")

    # Last 3 JF moods
    moods = conn.execute(
        "SELECT started_at, mood FROM jourfix_sessions WHERE employee_id = ? AND mood IS NOT NULL ORDER BY started_at DESC LIMIT 3",
        (employee_id,),
    ).fetchall()
    if moods:
        mood_emojis = {1: "1/5", 2: "2/5", 3: "3/5", 4: "4/5", 5: "5/5"}
        lines.append("\nLetzte JF-Stimmungen:")
        for m in moods:
            lines.append(f"  - {m['started_at'][:10]}: {mood_emojis.get(m['mood'], '?')}")

    return "\n".join(lines)


def _collect_project_context(conn, project_id):
    proj = conn.execute(
        "SELECT * FROM projects WHERE id = ?", (project_id,)
    ).fetchone()
    if not proj:
        return ""

    lines = [f"\nAktuelle Seite: Projekt '{proj['name']}'"]
    lines.append(f"Status: {proj['status']}")
    if proj["status_text"]:
        lines.append(f"Statuszeile: {proj['status_text']}")
    if proj["scope"]:
        lines.append(f"Scope: {proj['scope']}")

    # Members
    members = conn.execute(
        """SELECT e.name, pm.role_in_project FROM project_members pm
           JOIN employees e ON e.id = pm.employee_id
           WHERE pm.project_id = ?""",
        (project_id,),
    ).fetchall()
    if members:
        lines.append("\nTeam-Mitglieder:")
        for m in members:
            role = f" ({m['role_in_project']})" if m["role_in_project"] else ""
            lines.append(f"  - {m['name']}{role}")

    # Milestones
    milestones = conn.execute(
        "SELECT name, status, due_date FROM milestones WHERE project_id = ? ORDER BY sort_order",
        (project_id,),
    ).fetchall()
    if milestones:
        lines.append("\nMilestones:")
        for ms in milestones:
            due = f" (faellig: {ms['due_date']})" if ms["due_date"] else ""
            lines.append(f"  - [{ms['status']}] {ms['name']}{due}")

    # KPIs
    kpis = conn.execute(
        "SELECT label, value, unit FROM kpis WHERE project_id = ? ORDER BY sort_order",
        (project_id,),
    ).fetchall()
    if kpis:
        lines.append("\nKPIs:")
        for k in kpis:
            unit = f" {k['unit']}" if k["unit"] else ""
            lines.append(f"  - {k['label']}: {k['value']}{unit}")

    return "\n".join(lines)


def _collect_dashboard_context(conn):
    lines = ["\nAktuelle Seite: Dashboard"]

    # Active projects with members and departments
    projects = conn.execute(
        "SELECT id, name, status, status_text FROM projects WHERE status != 'abgeschlossen' ORDER BY name"
    ).fetchall()
    if projects:
        lines.append("\nAktive Projekte:")
        for p in projects:
            members = conn.execute(
                """SELECT e.name, e.department FROM project_members pm
                   JOIN employees e ON e.id = pm.employee_id
                   WHERE pm.project_id = ?""",
                (p["id"],),
            ).fetchall()
            member_info = ", ".join(
                f"{m['name']}" + (f" [{m['department']}]" if m["department"] else "")
                for m in members
            )
            status_info = f" - {p['status_text']}" if p["status_text"] else ""
            team = f" | Team: {member_info}" if member_info else ""
            lines.append(f"  - {p['name']} ({p['status']}){status_info}{team}")

    # Overdue agreements
    overdue = conn.execute(
        """SELECT a.content, a.due_date, e.name as employee_name
           FROM agreements a JOIN employees e ON e.id = a.employee_id
           WHERE a.status = 'offen' AND a.due_date != '' AND a.due_date < date('now')
           ORDER BY a.due_date""",
    ).fetchall()
    if overdue:
        lines.append("\nUeberfaellige Vereinbarungen:")
        for o in overdue:
            lines.append(f"  - {o['employee_name']}: {o['content']} (faellig: {o['due_date']})")

    return "\n".join(lines)


def _find_mentioned_employees(conn, message, current_emp_id=None):
    """Find employees mentioned by name or nickname in the user's message."""
    employees = conn.execute(
        "SELECT id, name FROM employees"
    ).fetchall()
    mentioned = []
    msg_lower = message.lower()
    msg_words = [w for w in msg_lower.split() if len(w) >= 3]
    for e in employees:
        name_parts = e["name"].lower().split()
        matched = False
        for part in name_parts:
            if len(part) <= 2:
                continue
            # Full name part found in message (e.g. "andrea" in "frag zu andrea")
            if part in msg_lower:
                matched = True
                break
            # Nickname: message word is prefix of name (e.g. "fabi" -> "fabian")
            for word in msg_words:
                if part.startswith(word):
                    matched = True
                    break
            if matched:
                break
        if matched and e["id"] != current_emp_id:
            mentioned.append(e["id"])
    return mentioned


def _build_context(conn, context_hint, message="", history=None):
    parts = [_collect_team_overview(conn)]
    current_emp_id = None

    if context_hint.startswith("employee:"):
        try:
            current_emp_id = int(context_hint.split(":")[1])
            parts.append(_collect_employee_context(conn, current_emp_id))
        except (ValueError, IndexError):
            pass
    elif context_hint.startswith("project:"):
        try:
            proj_id = int(context_hint.split(":")[1])
            parts.append(_collect_project_context(conn, proj_id))
        except (ValueError, IndexError):
            pass
    elif context_hint == "dashboard" or not context_hint:
        parts.append(_collect_dashboard_context(conn))

    # Auto-detect: scan current message for employee names
    mentioned_ids = []
    if message:
        mentioned_ids = _find_mentioned_employees(conn, message, current_emp_id)

    # Also scan recent history for follow-up questions ("was ist mit ihm?")
    if history and len(mentioned_ids) < 2:
        history_text = " ".join(
            msg.get("content", "") for msg in history[-6:]
            if msg.get("role") == "user"
        )
        if history_text:
            history_mentioned = _find_mentioned_employees(conn, history_text, current_emp_id)
            for eid in history_mentioned:
                if eid not in mentioned_ids:
                    mentioned_ids.append(eid)
                    if len(mentioned_ids) >= 2:
                        break

    for emp_id in mentioned_ids[:2]:
        parts.append(_collect_employee_context(conn, emp_id))

    return "\n\n".join(parts)


def _call_llm(settings, system_prompt, messages):
    provider = settings.get("provider", "ollama")
    endpoint = settings.get("endpoint", "http://localhost:11434")
    api_key = settings.get("api_key", "")
    model = settings.get("model", "llama3.2")

    if provider == "ollama":
        all_messages = [{"role": "system", "content": system_prompt}] + messages
        resp = requests.post(
            f"{endpoint}/api/chat",
            json={"model": model, "messages": all_messages, "stream": False},
            timeout=120,
        )
        if resp.status_code == 404:
            return None, "model_not_found", f"Modell '{model}' nicht gefunden."
        resp.raise_for_status()
        return resp.json()["message"]["content"], None, None

    elif provider == "gemini":
        if not api_key:
            return None, "not_configured", "API-Key fehlt."
        # Gemini uses a different message format
        gemini_contents = [{"role": "user", "parts": [{"text": system_prompt}]}, {"role": "model", "parts": [{"text": "Verstanden. Ich bin bereit zu helfen."}]}]
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={"contents": gemini_contents},
            timeout=120,
        )
        if resp.status_code in (400, 404):
            return None, "model_not_found", f"Modell '{model}' nicht gefunden."
        if resp.status_code in (401, 403):
            return None, "auth_failed", "API-Key ungueltig."
        if not resp.ok:
            return None, "unknown", f"Gemini API Fehler (HTTP {resp.status_code})."
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"], None, None

    elif provider == "openai":
        if not api_key:
            return None, "not_configured", "API-Key fehlt."
        all_messages = [{"role": "system", "content": system_prompt}] + messages
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": model, "messages": all_messages, "max_tokens": 1000},
            timeout=120,
        )
        if resp.status_code == 401:
            return None, "auth_failed", "API-Key ungueltig."
        if resp.status_code == 404:
            return None, "model_not_found", f"Modell '{model}' nicht gefunden."
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"], None, None

    elif provider == "anthropic":
        if not api_key:
            return None, "not_configured", "API-Key fehlt."
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1000,
                "system": system_prompt,
                "messages": messages,
            },
            timeout=120,
        )
        if resp.status_code == 401:
            return None, "auth_failed", "API-Key ungueltig."
        if resp.status_code == 404:
            return None, "model_not_found", f"Modell '{model}' nicht gefunden."
        resp.raise_for_status()
        return resp.json()["content"][0]["text"], None, None

    return None, "not_configured", f"Unbekannter Provider: {provider}"


@router.post("/chat")
def chat(data: ChatRequest):
    conn = get_db()
    try:
        settings = _get_ki_settings(conn)
        context = _build_context(conn, data.context_hint, data.message, data.history)
    finally:
        conn.close()

    system_prompt = SYSTEM_PROMPT.format(context=context)

    # Build messages: last 10 from history + current message
    messages = []
    for msg in data.history[-10:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": data.message})

    try:
        content, error_code, error_msg = _call_llm(settings, system_prompt, messages)
        if error_code:
            return {"response": None, "error": error_code, "message": error_msg}
        return {"response": content, "error": None}
    except requests.ConnectionError:
        provider = settings.get("provider", "ollama")
        if provider == "ollama":
            return {"response": None, "error": "connection_failed", "message": "Keine Verbindung zu Ollama. Laeuft der Server?"}
        return {"response": None, "error": "connection_failed", "message": "Verbindung zum API-Server fehlgeschlagen."}
    except requests.Timeout:
        return {"response": None, "error": "timeout", "message": "Antwort hat zu lange gedauert (>120s)."}
    except Exception as e:
        # Sanitize: never expose API keys in error messages
        error_msg = str(e)
        api_key = settings.get("api_key", "")
        if api_key and api_key in error_msg:
            error_msg = error_msg.replace(api_key, "***")
        return {"response": None, "error": "unknown", "message": error_msg}


BRIEFING_PROMPT = """Du bereitest ein Jour-Fixe-Gespraech vor. Erstelle eine strukturierte Vorbereitung
fuer den Teamlead. Gliedere nach:

1. **Rueckblick** — Was ist seit dem letzten JF passiert? (erledigte Vereinbarungen,
   abgeschlossene Milestones, KPI-Veraenderungen)
2. **Offene Punkte** — Welche Vereinbarungen/Milestones sind offen oder ueberfaellig?
3. **Entwicklung** — Stand bei Zielen, Entwicklungsplan, Weiterbildungen
4. **Gespraechsvorschlaege** — 3-5 konkrete Fragen die der Teamlead stellen sollte
5. **Aktion** — Was sollte als Vereinbarung/Milestone aus diesem JF entstehen?

Halte es kurz und praxisnah. Markdown-Formatierung.

Aktuelle Team-Daten:
{context}"""


def _collect_recap_context(conn, employee_id):
    """Collect recap data (changes since last JF) for the briefing."""
    last_jf = conn.execute(
        """SELECT id, completed_at FROM jourfix_sessions
           WHERE employee_id = ? AND completed_at IS NOT NULL
           ORDER BY completed_at DESC LIMIT 1""",
        (employee_id,),
    ).fetchone()

    if not last_jf:
        return "\nKein vorheriges Jour Fixe gefunden — dies ist das erste Gespraech."

    since = last_jf["completed_at"]
    lines = [f"\nRueckblick seit letztem JF ({since[:10]}):"]

    # Agreements completed since last JF
    agreements_completed = conn.execute(
        """SELECT a.content, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.status = 'erledigt' AND a.completed_at > ?
           ORDER BY a.completed_at DESC""",
        (employee_id, since),
    ).fetchall()
    if agreements_completed:
        lines.append("  Erledigte Vereinbarungen:")
        for a in agreements_completed:
            proj = f" [{a['project_name']}]" if a["project_name"] else ""
            lines.append(f"    - {a['content']}{proj}")
    else:
        lines.append("  Keine Vereinbarungen seit letztem JF erledigt.")

    # Get active project IDs
    project_ids = conn.execute(
        """SELECT p.id FROM projects p
           JOIN project_members pm ON pm.project_id = p.id
           WHERE pm.employee_id = ? AND p.status != 'abgeschlossen'""",
        (employee_id,),
    ).fetchall()
    proj_ids = [r["id"] for r in project_ids]

    if proj_ids:
        placeholders = ",".join("?" for _ in proj_ids)

        # Milestones completed
        milestones_completed = conn.execute(
            f"""SELECT m.name, p.name as project_name
                FROM milestones m
                JOIN projects p ON p.id = m.project_id
                WHERE m.project_id IN ({placeholders}) AND m.status = 'done' AND m.completed_at > ?
                ORDER BY m.completed_at DESC""",
            (*proj_ids, since),
        ).fetchall()
        if milestones_completed:
            lines.append("  Abgeschlossene Milestones:")
            for m in milestones_completed:
                lines.append(f"    - {m['name']} [{m['project_name']}]")

        # KPI changes
        kpi_changes = conn.execute(
            f"""SELECT k.label, p.name as project_name,
                       kh.old_value, kh.old_unit, kh.new_value, kh.new_unit
                FROM kpi_history kh
                JOIN kpis k ON k.id = kh.kpi_id
                JOIN projects p ON p.id = k.project_id
                WHERE k.project_id IN ({placeholders}) AND kh.changed_at > ?
                ORDER BY kh.changed_at DESC""",
            (*proj_ids, since),
        ).fetchall()
        if kpi_changes:
            lines.append("  KPI-Aenderungen:")
            for k in kpi_changes:
                unit = k["new_unit"] or ""
                lines.append(f"    - {k['label']} [{k['project_name']}]: {k['old_value']} → {k['new_value']} {unit}")

        # Overdue milestones
        overdue_milestones = conn.execute(
            f"""SELECT m.name, m.due_date, p.name as project_name
                FROM milestones m
                JOIN projects p ON p.id = m.project_id
                WHERE m.project_id IN ({placeholders}) AND m.status != 'done'
                AND m.due_date != '' AND m.due_date < date('now')
                ORDER BY m.due_date""",
            proj_ids,
        ).fetchall()
        if overdue_milestones:
            lines.append("  Ueberfaellige Milestones:")
            for m in overdue_milestones:
                lines.append(f"    - {m['name']} [{m['project_name']}] (faellig: {m['due_date']})")

    # Overdue agreements
    overdue_agreements = conn.execute(
        """SELECT a.content, a.due_date, p.name as project_name
           FROM agreements a
           LEFT JOIN projects p ON p.id = a.project_id
           WHERE a.employee_id = ? AND a.status = 'offen'
           AND a.due_date != '' AND a.due_date < date('now')
           ORDER BY a.due_date""",
        (employee_id,),
    ).fetchall()
    if overdue_agreements:
        lines.append("  Ueberfaellige Vereinbarungen:")
        for a in overdue_agreements:
            proj = f" [{a['project_name']}]" if a["project_name"] else ""
            lines.append(f"    - {a['content']}{proj} (faellig: {a['due_date']})")

    return "\n".join(lines)


@router.post("/employees/{employee_id}/jourfix/briefing")
def jourfix_briefing(employee_id: int):
    conn = get_db()
    try:
        settings = _get_ki_settings(conn)
        if not settings.get("provider"):
            raise HTTPException(400, "KI nicht konfiguriert. Bitte Provider in den Einstellungen setzen.")

        emp = conn.execute("SELECT id FROM employees WHERE id = ?", (employee_id,)).fetchone()
        if not emp:
            raise HTTPException(404, "Mitarbeiter nicht gefunden")

        # Build context: team overview + employee details + recap
        context_parts = [
            _collect_team_overview(conn),
            _collect_employee_context(conn, employee_id),
            _collect_recap_context(conn, employee_id),
        ]
        context = "\n\n".join(context_parts)
    finally:
        conn.close()

    system_prompt = BRIEFING_PROMPT.format(context=context)
    messages = [{"role": "user", "content": f"Erstelle eine JF-Vorbereitung fuer diesen Mitarbeiter."}]

    try:
        content, error_code, error_msg = _call_llm(settings, system_prompt, messages)
        if error_code:
            return {"briefing": None, "error": error_msg}
        return {"briefing": content, "error": None}
    except requests.ConnectionError:
        provider = settings.get("provider", "ollama")
        if provider == "ollama":
            return {"briefing": None, "error": "Keine Verbindung zu Ollama. Laeuft der Server?"}
        return {"briefing": None, "error": "Verbindung zum API-Server fehlgeschlagen."}
    except requests.Timeout:
        return {"briefing": None, "error": "Antwort hat zu lange gedauert (>120s)."}
    except Exception as e:
        error_msg = str(e)
        api_key = settings.get("api_key", "")
        if api_key and api_key in error_msg:
            error_msg = error_msg.replace(api_key, "***")
        return {"briefing": None, "error": error_msg}
