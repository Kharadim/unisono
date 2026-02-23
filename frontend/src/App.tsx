import { useState, useCallback, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, setAuthToken, clearAuthToken } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { SplashScreen } from '@/components/dashboard/SplashScreen'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { Menu } from 'lucide-react'

const TOUR_KEYS = ['teamlead-tour-dashboard', 'teamlead-tour-employee', 'teamlead-tour-jourfix']

type AuthState = 'loading' | 'no_password' | 'not_authenticated' | 'authenticated'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const location = useLocation()
  const navigate = useNavigate()

  // Check auth status on mount — server validates token
  useEffect(() => {
    api.getAuthStatus()
      .then(status => {
        if (!status.has_password) {
          setAuthState('no_password')
        } else if (status.token_valid) {
          setAuthState('authenticated')
        } else {
          clearAuthToken()
          setAuthState('not_authenticated')
        }
      })
      .catch(() => {
        setAuthState('not_authenticated')
      })
  }, [])

  const { data: kiSettings } = useQuery({
    queryKey: ['ki-settings'],
    queryFn: api.getKISettings,
    enabled: authState === 'authenticated',
  })
  const kiEnabled = kiSettings?.enabled !== false

  const startTour = useCallback(() => {
    TOUR_KEYS.forEach(key => localStorage.removeItem(key))
    navigate('/')
    // Force re-render of DashboardPage by toggling a key
    window.dispatchEvent(new Event('tour-reset'))
  }, [navigate])

  const handleAuthenticated = useCallback((token: string) => {
    setAuthToken(token)
    setAuthState('authenticated')
  }, [])

  // Close sidebar on route change (mobile)
  const closeSidebar = () => setSidebarOpen(false)

  // Show loading state while checking auth
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sidebar-bg">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // Show login/setup screen if not authenticated
  if (authState === 'no_password') {
    return <LoginScreen mode="setup" onAuthenticated={handleAuthenticated} />
  }

  if (authState === 'not_authenticated') {
    return <LoginScreen mode="login" onAuthenticated={handleAuthenticated} />
  }

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:relative md:z-auto
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar onNavigate={closeSidebar} onStartTour={startTour} />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b bg-sidebar-bg">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-sidebar-accent text-white">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-white">Unisono</span>
        </div>

        <Outlet />
      </main>

      {/* Chat Widget — persistent across pages, hidden when KI disabled */}
      {kiEnabled && <ChatWidget />}
    </div>
  )
}
