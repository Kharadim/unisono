/**
 * Smart sidecar rebuild check.
 * Compares modification times of all backend/*.py files against the
 * PyInstaller binary. Rebuilds only if Python code is newer.
 *
 * Runs as part of `npm run predev` before `cargo tauri dev`.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SIDECAR = path.join(__dirname, 'src-tauri', 'binaries', 'unisono-server-x86_64-pc-windows-msvc.exe');
const BACKEND_DIR = path.join(__dirname, 'backend');

function getNewestPyFile(dir) {
  let newest = 0;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== '__pycache__') {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.py')) {
        const mtime = fs.statSync(full).mtimeMs;
        if (mtime > newest) newest = mtime;
      }
    }
  }
  walk(dir);
  return newest;
}

// If sidecar doesn't exist, always build
if (!fs.existsSync(SIDECAR)) {
  console.log('[sidecar] Binary nicht gefunden — wird gebaut...');
  execSync('npm run build:sidecar', { stdio: 'inherit', cwd: __dirname });
  process.exit(0);
}

const sidecarMtime = fs.statSync(SIDECAR).mtimeMs;
const newestPy = getNewestPyFile(BACKEND_DIR);

if (newestPy > sidecarMtime) {
  console.log('[sidecar] Python-Code neuer als Binary — wird neu gebaut...');
  execSync('npm run build:sidecar', { stdio: 'inherit', cwd: __dirname });
} else {
  console.log('[sidecar] Binary ist aktuell — kein Rebuild noetig.');
}
