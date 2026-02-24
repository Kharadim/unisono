"""
Unisono configuration — resolves data directory and port.

When launched by Tauri sidecar:
  unisono-server --data-dir /path/to/appdata --port 12345

Standalone fallback:
  python -m uvicorn backend.main:app --port 8001
  → data lives in backend/data/ (original behavior)
"""

import sys
from pathlib import Path

# Defaults (standalone mode — same behavior as original Teamlead)
_data_dir: Path | None = None
_port: int = 8001
_db_name: str = "unisono.db"

# Parse CLI args (set by Tauri sidecar or unisono_entry.py)
_args = sys.argv[1:]
for i, arg in enumerate(_args):
    if arg == "--data-dir" and i + 1 < len(_args):
        _data_dir = Path(_args[i + 1])
    elif arg == "--port" and i + 1 < len(_args):
        try:
            _port = int(_args[i + 1])
        except ValueError:
            pass

# Resolve paths
if _data_dir is not None:
    DATA_DIR = _data_dir
else:
    DATA_DIR = Path(__file__).parent / "data"

DB_PATH = DATA_DIR / _db_name
PHOTOS_DIR = DATA_DIR / "photos"
PORT = _port
