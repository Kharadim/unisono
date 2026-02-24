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
  const [ready, setReady] = useState(!isTauri || !!w.__UNISONO_PORT__)

  useEffect(() => {
    if (ready) return
    const interval = setInterval(() => {
      if ((window as any).__UNISONO_PORT__) {
        setReady(true)
        clearInterval(interval)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [ready])

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <div style={{ fontSize: '14px' }}>Backend wird gestartet...</div>
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
