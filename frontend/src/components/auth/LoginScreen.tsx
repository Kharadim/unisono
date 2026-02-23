import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Handshake, Eye, EyeOff, Lock } from 'lucide-react'
import { api } from '@/lib/api'

interface LoginScreenProps {
  mode: 'setup' | 'login'
  onAuthenticated: (token: string) => void
}

export function LoginScreen({ mode, onAuthenticated }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSetup = async () => {
    if (password.length < 4) {
      setError('Passwort muss mindestens 4 Zeichen lang sein.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwoerter stimmen nicht ueberein.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.setupPassword(password)
      onAuthenticated(data.token)
    } catch (e: any) {
      setError(e.message || 'Fehler beim Einrichten.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!password) {
      setError('Bitte Passwort eingeben.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.login(password)
      onAuthenticated(data.token)
    } catch (e: any) {
      setError(e.message || 'Falsches Passwort.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = mode === 'setup' ? handleSetup : handleLogin

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sidebar-bg">
      <div className="w-full max-w-sm px-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Logo */}
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-sidebar-active flex items-center justify-center">
          <Handshake className="h-8 w-8 text-white" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {mode === 'setup' ? 'Passwort festlegen' : 'Anmelden'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'setup'
                ? 'Schuetze deine Mitarbeiterdaten mit einem Passwort.'
                : 'Unisono'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' || confirmPassword) && handleSubmit()}
                autoFocus
                className="w-full h-10 px-3 pr-10 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === 'setup' && (
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort bestaetigen"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full h-10 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !password || (mode === 'setup' && !confirmPassword)}
              className="w-full"
            >
              {loading ? 'Bitte warten...' : mode === 'setup' ? 'Passwort festlegen' : 'Anmelden'}
            </Button>
          </div>

          {mode === 'setup' && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Dieses Passwort schuetzt den Zugang zu Unisono auf diesem Computer.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
