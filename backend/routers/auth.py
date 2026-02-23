import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from backend.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    ).hex()


def _get_setting(conn, key: str) -> str:
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else ""


def _set_setting(conn, key: str, value: str):
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value)
    )


def _check_rate_limit(conn):
    """Check if login is blocked due to too many failed attempts."""
    lockout_until = _get_setting(conn, "auth_lockout_until")
    if lockout_until:
        try:
            lockout_dt = datetime.fromisoformat(lockout_until)
            if datetime.now() < lockout_dt:
                remaining = int((lockout_dt - datetime.now()).total_seconds() // 60) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Zu viele Fehlversuche. Bitte warte {remaining} Minute(n).",
                )
            # Lockout expired — reset
            _set_setting(conn, "auth_failed_attempts", "0")
            _set_setting(conn, "auth_lockout_until", "")
            conn.commit()
        except HTTPException:
            raise
        except Exception:
            pass


def _record_failed_attempt(conn):
    """Record a failed login attempt, set lockout if threshold reached."""
    attempts = int(_get_setting(conn, "auth_failed_attempts") or "0") + 1
    _set_setting(conn, "auth_failed_attempts", str(attempts))
    if attempts >= MAX_ATTEMPTS:
        lockout_until = (datetime.now() + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        _set_setting(conn, "auth_lockout_until", lockout_until)
    conn.commit()


def _reset_failed_attempts(conn):
    """Reset failed attempt counter after successful login."""
    _set_setting(conn, "auth_failed_attempts", "0")
    _set_setting(conn, "auth_lockout_until", "")


class PasswordSetup(BaseModel):
    password: str


class LoginRequest(BaseModel):
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.get("/status")
def auth_status(request: Request):
    """Check if password is set and if current token is valid."""
    conn = get_db()
    try:
        pw_hash = _get_setting(conn, "auth_password_hash")
        has_password = bool(pw_hash)
        # Verify token if provided
        token_valid = False
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            stored_token = _get_setting(conn, "auth_session_token")
            if stored_token and secrets.compare_digest(token, stored_token):
                token_valid = True
        return {"has_password": has_password, "token_valid": token_valid}
    finally:
        conn.close()


@router.post("/setup")
def setup_password(data: PasswordSetup):
    """Set initial password. Only works if no password is set yet."""
    if len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 4 Zeichen lang sein.")
    conn = get_db()
    try:
        existing = _get_setting(conn, "auth_password_hash")
        if existing:
            raise HTTPException(status_code=400, detail="Passwort ist bereits gesetzt. Nutze Passwort aendern.")
        salt = secrets.token_hex(16)
        hashed = _hash_password(data.password, salt)
        _set_setting(conn, "auth_password_hash", f"{salt}:{hashed}")
        # Generate session token
        token = secrets.token_urlsafe(32)
        _set_setting(conn, "auth_session_token", token)
        conn.commit()
        return {"token": token}
    finally:
        conn.close()


@router.post("/login")
def login(data: LoginRequest):
    """Verify password and return session token."""
    conn = get_db()
    try:
        _check_rate_limit(conn)
        stored = _get_setting(conn, "auth_password_hash")
        if not stored:
            raise HTTPException(status_code=400, detail="Kein Passwort gesetzt.")
        salt, expected_hash = stored.split(":", 1)
        actual_hash = _hash_password(data.password, salt)
        if not secrets.compare_digest(actual_hash, expected_hash):
            _record_failed_attempt(conn)
            raise HTTPException(status_code=401, detail="Falsches Passwort.")
        _reset_failed_attempts(conn)
        token = secrets.token_urlsafe(32)
        _set_setting(conn, "auth_session_token", token)
        conn.commit()
        return {"token": token}
    finally:
        conn.close()


@router.post("/logout")
def logout():
    """Invalidate current session token."""
    conn = get_db()
    try:
        _set_setting(conn, "auth_session_token", "")
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@router.put("/change-password")
def change_password(data: ChangePasswordRequest):
    """Change password. Requires old password for verification."""
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 4 Zeichen lang sein.")
    conn = get_db()
    try:
        stored = _get_setting(conn, "auth_password_hash")
        if not stored:
            raise HTTPException(status_code=400, detail="Kein Passwort gesetzt.")
        salt, expected_hash = stored.split(":", 1)
        actual_hash = _hash_password(data.old_password, salt)
        if not secrets.compare_digest(actual_hash, expected_hash):
            raise HTTPException(status_code=401, detail="Altes Passwort ist falsch.")
        new_salt = secrets.token_hex(16)
        new_hash = _hash_password(data.new_password, new_salt)
        _set_setting(conn, "auth_password_hash", f"{new_salt}:{new_hash}")
        # Generate new session token
        token = secrets.token_urlsafe(32)
        _set_setting(conn, "auth_session_token", token)
        conn.commit()
        return {"token": token}
    finally:
        conn.close()
