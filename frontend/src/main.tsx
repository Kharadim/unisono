import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom'
import App from './App'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeePage } from '@/pages/EmployeePage'
import { ProjectPage } from '@/pages/ProjectPage'
import { ProjectHistoryPage } from '@/pages/ProjectHistoryPage'
import { JourFixePage } from '@/pages/JourFixePage'
import { JourFixProtocolPage } from '@/pages/JourFixProtocolPage'
import { DatenschutzPage } from '@/pages/DatenschutzPage'
import { HelpPage } from '@/pages/HelpPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/employees/:id" element={<EmployeePage />} />
      <Route path="/projects/:id" element={<ProjectPage />} />
      <Route path="/projects/:id/history" element={<ProjectHistoryPage />} />
      <Route path="/jourfix/:employeeId" element={<JourFixePage />} />
      <Route path="/jourfix/:sessionId/protocol" element={<JourFixProtocolPage />} />
      <Route path="/hilfe" element={<HelpPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
)

/**
 * In Tauri mode, wait for window.__UNISONO_PORT__ to be injected
 * before rendering the app. The port is set by lib.rs after the
 * backend health check completes.
 */
function TauriGate({ children }: { children: React.ReactNode }) {
  const w = window as any
  const isTauri = !!(w.__TAURI__ || w.__TAURI_INTERNALS__)

  // Restore port from sessionStorage after page reload (e.g. logout)
  if (isTauri && !w.__UNISONO_PORT__) {
    const saved = sessionStorage.getItem('unisono_port')
    if (saved) w.__UNISONO_PORT__ = Number(saved)
  }
  // Persist port so it survives future reloads
  if (isTauri && w.__UNISONO_PORT__) {
    sessionStorage.setItem('unisono_port', String(w.__UNISONO_PORT__))
  }

  const [ready, setReady] = useState(!isTauri || !!w.__UNISONO_PORT__)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (ready) return
    // Don't poll during shutdown
    if ((window as any).__UNISONO_SHUTTING_DOWN__) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      if ((window as any).__UNISONO_PORT__) {
        // Persist port so it survives page reloads
        sessionStorage.setItem('unisono_port', String((window as any).__UNISONO_PORT__))
        setReady(true)
        clearInterval(interval)
      } else if (Date.now() - startTime > 10_000) {
        setTimedOut(true)
        clearInterval(interval)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [ready])

  if (!ready) {
    // During shutdown, show nothing (window is closing anyway)
    if ((window as any).__UNISONO_SHUTTING_DOWN__) {
      return <div style={{ height: '100vh', background: '#f8f9fa' }} />
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', color: timedOut ? '#dc2626' : '#6b7280' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>{timedOut ? '!' : ''}</div>
          <div style={{ fontSize: '14px' }}>
            {timedOut
              ? 'Verbindung zum Backend fehlgeschlagen. Bitte App neu starten.'
              : 'Verbinde mit Backend...'}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TauriGate>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TauriGate>
  </StrictMode>,
)
