from fastapi import APIRouter
from backend.database import get_db
from backend.schemas import KISettingsUpdate
import requests

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_ki_settings(conn):
    rows = conn.execute(
        "SELECT key, value FROM settings WHERE key LIKE 'ki_%'"
    ).fetchall()
    result = {}
    for row in rows:
        short_key = row["key"].replace("ki_", "", 1)
        result[short_key] = row["value"]
    # Ensure ki_enabled exists (migration safety)
    if "enabled" not in result:
        conn.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('ki_enabled', 'true')")
        conn.commit()
        result["enabled"] = "true"
    return result


@router.get("/ki")
def get_ki_settings():
    conn = get_db()
    try:
        settings = _get_ki_settings(conn)
        # Mask the API key for frontend display
        if settings.get("api_key"):
            settings["api_key_set"] = True
            settings["api_key"] = ""
        else:
            settings["api_key_set"] = False
        # Convert enabled to boolean for frontend
        settings["enabled"] = settings.get("enabled", "true") == "true"
        return settings
    finally:
        conn.close()


@router.put("/ki")
def update_ki_settings(data: KISettingsUpdate):
    conn = get_db()
    try:
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = 'ki_provider'",
            (data.provider,),
        )
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = 'ki_endpoint'",
            (data.endpoint,),
        )
        # Only update API key if a non-empty value is provided
        if data.api_key:
            conn.execute(
                "UPDATE settings SET value = ? WHERE key = 'ki_api_key'",
                (data.api_key,),
            )
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = 'ki_model'",
            (data.model,),
        )
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('ki_enabled', ?)",
            ("true" if data.enabled else "false",),
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@router.post("/ki/test")
def test_ki_connection():
    conn = get_db()
    try:
        settings = _get_ki_settings(conn)
    finally:
        conn.close()

    provider = settings.get("provider", "ollama")
    endpoint = settings.get("endpoint", "http://localhost:11434")
    api_key = settings.get("api_key", "")
    model = settings.get("model", "llama3.2")

    try:
        if provider == "ollama":
            resp = requests.post(
                f"{endpoint}/api/chat",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Sag einfach: Verbindung OK"}],
                    "stream": False,
                },
                timeout=120,
            )
            if resp.status_code == 404:
                return {"ok": False, "error": "model_not_found", "message": f"Modell '{model}' nicht gefunden. Bitte mit 'ollama pull {model}' installieren."}
            resp.raise_for_status()
            content = resp.json().get("message", {}).get("content", "")
            return {"ok": True, "message": content}

        elif provider == "gemini":
            if not api_key:
                return {"ok": False, "error": "not_configured", "message": "API-Key fehlt."}
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": "Sag einfach: Verbindung OK"}]}],
                },
                timeout=120,
            )
            if resp.status_code in (400, 404):
                return {"ok": False, "error": "model_not_found", "message": f"Modell '{model}' nicht gefunden. Versuche 'gemini-2.0-flash' oder 'gemini-1.5-flash'."}
            if resp.status_code in (401, 403):
                return {"ok": False, "error": "auth_failed", "message": "API-Key ungueltig."}
            if not resp.ok:
                return {"ok": False, "error": "unknown", "message": f"Gemini API Fehler (HTTP {resp.status_code})."}
            content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            return {"ok": True, "message": content}

        elif provider == "openai":
            if not api_key:
                return {"ok": False, "error": "not_configured", "message": "API-Key fehlt."}
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Sag einfach: Verbindung OK"}],
                    "max_tokens": 20,
                },
                timeout=120,
            )
            if resp.status_code == 401:
                return {"ok": False, "error": "auth_failed", "message": "API-Key ungueltig."}
            if resp.status_code == 404:
                return {"ok": False, "error": "model_not_found", "message": f"Modell '{model}' nicht gefunden."}
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            return {"ok": True, "message": content}

        elif provider == "anthropic":
            if not api_key:
                return {"ok": False, "error": "not_configured", "message": "API-Key fehlt."}
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 20,
                    "messages": [{"role": "user", "content": "Sag einfach: Verbindung OK"}],
                },
                timeout=120,
            )
            if resp.status_code == 401:
                return {"ok": False, "error": "auth_failed", "message": "API-Key ungueltig."}
            if resp.status_code == 404:
                return {"ok": False, "error": "model_not_found", "message": f"Modell '{model}' nicht gefunden."}
            resp.raise_for_status()
            content = resp.json()["content"][0]["text"]
            return {"ok": True, "message": content}

        else:
            return {"ok": False, "error": "not_configured", "message": f"Unbekannter Provider: {provider}"}

    except requests.ConnectionError:
        return {"ok": False, "error": "connection_failed", "message": f"Keine Verbindung zu {endpoint}. Laeuft Ollama?"}
    except requests.Timeout:
        return {"ok": False, "error": "timeout", "message": "Antwort hat zu lange gedauert (>120s)."}
    except Exception as e:
        # Sanitize: never expose API keys in error messages
        error_msg = str(e)
        if api_key and api_key in error_msg:
            error_msg = error_msg.replace(api_key, "***")
        return {"ok": False, "error": "unknown", "message": error_msg}
