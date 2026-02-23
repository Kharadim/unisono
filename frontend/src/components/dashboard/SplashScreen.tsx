import { useState, useMemo, useCallback } from 'react'
import { getTodaysQuote } from '@/lib/quotes'
import { Button } from '@/components/ui/button'
import { Handshake } from 'lucide-react'

const GREETINGS_MORNING = [
  { greeting: 'Guten Morgen', subtitle: 'Bereit für den Tag?' },
  { greeting: 'Moin', subtitle: 'Was steht heute an?' },
  { greeting: 'Frisch ans Werk', subtitle: 'Auf geht\'s!' },
  { greeting: 'Guten Morgen', subtitle: 'Kaffee schon fertig?' },
  { greeting: 'Moin', subtitle: 'Neuer Tag, neue Chancen.' },
]

const GREETINGS_DAY = [
  { greeting: 'Hallo', subtitle: 'Schön, dass du da bist.' },
  { greeting: 'Willkommen zurück', subtitle: 'Wie läuft der Tag?' },
  { greeting: 'Hallo', subtitle: 'Alles im Griff?' },
  { greeting: 'Willkommen zurück', subtitle: 'Wo waren wir stehen geblieben?' },
  { greeting: 'Hey', subtitle: 'Lass uns loslegen.' },
]

const GREETINGS_EVENING = [
  { greeting: 'Guten Abend', subtitle: 'Noch fleißig?' },
  { greeting: 'Hey', subtitle: 'Schön, dass du reinschaust.' },
  { greeting: 'Guten Abend', subtitle: 'Kurzer Check-in?' },
  { greeting: 'Na', subtitle: 'Feierabend-Runde?' },
  { greeting: 'Hey', subtitle: 'Auf den letzten Drücker?' },
]

function getTimeBasedGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours()
  const pool = hour < 12 ? GREETINGS_MORNING : hour < 18 ? GREETINGS_DAY : GREETINGS_EVENING
  return pool[Math.floor(Math.random() * pool.length)]
}

const STORAGE_KEY = 'teamlead-username'

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [editValue, setEditValue] = useState('')
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible')

  const { greeting, subtitle } = useMemo(() => getTimeBasedGreeting(), [])
  const quote = useMemo(() => getTodaysQuote(), [])

  const isFirstVisit = !userName

  const dismiss = useCallback(() => {
    if (phase === 'fading') return
    setPhase('fading')
    setTimeout(onDone, 500)
  }, [phase, onDone])

  // No auto-dismiss — user must click

  const saveName = () => {
    const trimmed = editValue.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setUserName(trimmed)
  }

  // First visit: ask for name
  if (isFirstVisit) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sidebar-bg">
        <div className="text-center px-6 max-w-md animate-in fade-in zoom-in-95 duration-150">
          {/* Logo */}
          <div className="mx-auto mb-8 h-16 w-16 rounded-2xl bg-sidebar-active flex items-center justify-center">
            <Handshake className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Willkommen bei Unisono</h1>
          <p className="text-sidebar-foreground mb-8">Wie heißt du?</p>

          <div className="flex items-center gap-2 max-w-xs mx-auto">
            <input
              placeholder="Dein Vorname"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && editValue.trim() && saveName()}
              autoFocus
              className="flex-1 h-10 px-4 rounded-lg text-sm bg-sidebar-muted border-0 text-white placeholder:text-sidebar-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-active text-center"
            />
            <Button onClick={saveName} disabled={!editValue.trim()}>
              Los geht's
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Regular splash with greeting + quote
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-sidebar-bg cursor-pointer transition-opacity duration-500 ${
        phase === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={dismiss}
    >
      <div className="text-center px-6 max-w-lg splash-content">
        {/* Logo */}
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-sidebar-active flex items-center justify-center splash-logo">
          <Handshake className="h-7 w-7 text-white" />
        </div>

        {/* Greeting */}
        <h1 className="text-4xl font-bold text-white mb-2 splash-text-1">
          {greeting}, {userName}.
        </h1>
        <p className="text-lg text-sidebar-foreground mb-10 splash-text-2">
          {subtitle}
        </p>

        {/* Quote */}
        <div className="max-w-md mx-auto splash-text-3">
          <p className="text-sidebar-foreground/80 italic leading-relaxed">
            „{quote.text}"
          </p>
          <p className="text-sidebar-muted-foreground text-sm mt-2">
            — {quote.author}
          </p>
        </div>

        {/* Skip hint */}
        <p className="text-sidebar-muted-foreground text-xs mt-12 splash-text-3">
          Klick um fortzufahren
        </p>
      </div>
    </div>
  )
}
