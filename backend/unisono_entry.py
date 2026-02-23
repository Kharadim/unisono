"""
PyInstaller entry point for the Unisono backend sidecar.

Usage (by Tauri):
  unisono-server --data-dir /path/to/appdata --port 12345

Monitors STDIN for "SHUTDOWN" command from Tauri for graceful exit.
"""

import sys
import threading
import uvicorn

from backend.config import PORT
from backend.main import app


def _watch_stdin():
    """Watch STDIN for SHUTDOWN signal from Tauri."""
    try:
        for line in sys.stdin:
            if line.strip() == "SHUTDOWN":
                import os
                os._exit(0)
    except (EOFError, OSError):
        # STDIN closed — parent process gone, exit gracefully
        import os
        os._exit(0)


def main():
    # Start STDIN watcher in background thread
    watcher = threading.Thread(target=_watch_stdin, daemon=True)
    watcher.start()

    # Start uvicorn — pass app object directly (required for PyInstaller)
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=PORT,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
