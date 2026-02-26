/**
 * dev-server.js — Unified Dev Orchestrator for Unisono.
 *
 * Replaces kill-zombies.js + ensure-sidecar.js as the dev entry point.
 * 1. Kills zombie processes on ports 1420 (Vite) and 8001+ (Backend)
 * 2. Finds a free port starting at 8001
 * 3. Starts live Python backend with --reload
 * 4. Waits for health check
 * 5. Launches `cargo tauri dev` with UNISONO_DEV_PORT env var
 * 6. On exit: kills Python child automatically (no zombies)
 *
 * Usage: node dev-server.js   (called via `npm run dev`)
 */

const { execSync, spawn } = require('child_process')
const http = require('http')
const net = require('net')

const VITE_PORT = 1420
const BACKEND_PORT_START = 8001
const HEALTH_CHECK_INTERVAL = 300
const HEALTH_CHECK_TIMEOUT = 15000

// --- Step 1: Kill zombies on known ports ---
function killZombies() {
  const ports = [VITE_PORT, BACKEND_PORT_START]
  for (const port of ports) {
    try {
      const output = execSync('netstat -ano', { encoding: 'utf8' })
      const lines = output.split('\n').filter(l =>
        (l.includes('LISTENING') || l.includes('ABH')) && l.includes(`:${port} `)
      )
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && /^\d+$/.test(pid)) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
            console.log(`[dev] Port ${port}: Zombie-Prozess ${pid} beendet`)
          } catch { /* already exited */ }
        }
      }
    } catch { /* netstat not available */ }
  }
}

// --- Step 2: Find a free port ---
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

async function findFreePort(start) {
  for (let port = start; port < start + 20; port++) {
    if (await isPortFree(port)) return port
  }
  throw new Error(`Kein freier Port im Bereich ${start}-${start + 19}`)
}

// --- Step 3: Health check ---
function healthCheck(port) {
  return new Promise((resolve) => {
    const url = `http://127.0.0.1:${port}/api/auth/status`
    http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400)
    }).on('error', () => resolve(false))
  })
}

async function waitForHealth(port) {
  const start = Date.now()
  while (Date.now() - start < HEALTH_CHECK_TIMEOUT) {
    if (await healthCheck(port)) return true
    await new Promise(r => setTimeout(r, HEALTH_CHECK_INTERVAL))
  }
  return false
}

// --- Main ---
async function main() {
  console.log('[dev] Unisono Dev Orchestrator')
  console.log('[dev] Raeume Zombie-Prozesse auf...')
  killZombies()

  const port = await findFreePort(BACKEND_PORT_START)
  console.log(`[dev] Backend-Port: ${port}`)

  // Start Python backend with live reload
  console.log('[dev] Starte Python Backend (Live-Reload)...')
  const python = spawn(
    `python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port ${port}`,
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true  // Needed for pyenv shims on Windows
    }
  )

  python.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  python.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`))

  python.on('error', (err) => {
    console.error(`[dev] Python konnte nicht gestartet werden: ${err.message}`)
    process.exit(1)
  })

  python.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[dev] Python beendet mit Code ${code}`)
    }
  })

  // Wait for backend to be ready
  console.log('[dev] Warte auf Backend Health-Check...')
  const ready = await waitForHealth(port)
  if (!ready) {
    console.error('[dev] Backend nicht bereit nach 15s — Abbruch')
    python.kill()
    process.exit(1)
  }
  console.log(`[dev] Backend bereit auf Port ${port}`)

  // Launch cargo tauri dev with the port as env var
  console.log('[dev] Starte Tauri...')
  const tauri = spawn('cargo tauri dev', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      UNISONO_DEV_PORT: String(port)
    },
    shell: true
  })

  // When Tauri exits, kill Python and exit
  tauri.on('exit', (code) => {
    console.log(`[dev] Tauri beendet (Code ${code})`)
    python.kill()
    process.exit(code || 0)
  })

  // Handle SIGINT/SIGTERM — kill both
  function cleanup() {
    console.log('\n[dev] Beende...')
    python.kill()
    tauri.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  // Windows: handle Ctrl+C
  if (process.platform === 'win32') {
    process.on('SIGHUP', cleanup)
  }
}

main().catch((err) => {
  console.error(`[dev] Fehler: ${err.message}`)
  process.exit(1)
})
