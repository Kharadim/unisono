/**
 * kill-zombies.js — Kills zombie processes on dev ports before starting.
 * Called automatically via "predev" script in package.json.
 * Checks ports 1420 (Vite) and 8001 (Standalone Backend).
 */
const { execSync } = require('child_process')

const PORTS = [1420, 8001]

for (const port of PORTS) {
  try {
    const output = execSync(`netstat -ano`, { encoding: 'utf8' })
    // Match LISTENING (English) or ABHÖREN (German Windows)
    const lines = output.split('\n').filter(l => (l.includes('LISTENING') || l.includes('ABH')) && l.includes(`:${port} `))
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && /^\d+$/.test(pid)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
          console.log(`[cleanup] Port ${port}: Zombie-Prozess ${pid} beendet`)
        } catch {
          // Process may have already exited
        }
      }
    }
  } catch {
    // netstat not available or no matches — ignore
  }
}
