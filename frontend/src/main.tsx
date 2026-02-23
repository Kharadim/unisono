import { StrictMode } from 'react'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
