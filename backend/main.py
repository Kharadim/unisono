from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from backend.database import init_db, get_db, PHOTOS_DIR
from backend.routers import employees, projects, milestones, kpis, notes, jourfix, agenda, agreements, goals, tags, dashboard, settings, chat, devplan, demo, auth

app = FastAPI(title="Unisono")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # Vite dev server
        "http://localhost:1420",        # Tauri dev server
        "tauri://localhost",            # Tauri WebView (macOS)
        "https://tauri.localhost",      # Tauri WebView (Windows)
        "http://tauri.localhost",       # Tauri WebView fallback
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # Skip auth for: non-API routes, auth endpoints, CORS preflight
    if not path.startswith("/api/") or path.startswith("/api/auth/") or request.method == "OPTIONS":
        return await call_next(request)
    # Check if password is set — if not, allow all (first-time setup)
    conn = get_db()
    try:
        row = conn.execute("SELECT value FROM settings WHERE key = 'auth_password_hash'").fetchone()
        pw_hash = row["value"] if row else ""
        if not pw_hash:
            return await call_next(request)
        # Password is set — require valid token
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Nicht authentifiziert."})
        token = auth_header[7:]
        row = conn.execute("SELECT value FROM settings WHERE key = 'auth_session_token'").fetchone()
        stored_token = row["value"] if row else ""
        if not stored_token or token != stored_token:
            return JSONResponse(status_code=401, content={"detail": "Sitzung abgelaufen."})
    finally:
        conn.close()
    return await call_next(request)


# Include routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(projects.router)
app.include_router(milestones.router)
app.include_router(kpis.router)
app.include_router(notes.router)
app.include_router(jourfix.router)
app.include_router(agenda.router)
app.include_router(agreements.router)
app.include_router(goals.router)
app.include_router(tags.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(chat.router)
app.include_router(devplan.router)
app.include_router(demo.router)

# Serve photos (behind auth middleware — no StaticFiles, must be a route)
import re as _re
from fastapi import HTTPException as _HTTPException

@app.get("/api/photos/{filename}")
def serve_photo(filename: str):
    if not _re.match(r'^[\w.-]+$', filename):
        raise _HTTPException(status_code=404)
    filepath = PHOTOS_DIR / filename
    if not filepath.is_file():
        raise _HTTPException(status_code=404)
    return FileResponse(filepath)


@app.on_event("startup")
def startup():
    init_db()
    # Invalidate session on every server start — forces re-login
    conn = get_db()
    try:
        conn.execute("UPDATE settings SET value = '' WHERE key = 'auth_session_token'")
        conn.commit()
    finally:
        conn.close()
