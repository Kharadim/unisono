import { useState, useEffect, useMemo } from 'react'
import { getTodaysQuote } from '@/lib/quotes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Quote, Pencil, Check } from 'lucide-react'

const GREETINGS_MORNING = [
  'Guten Morgen',
  'Moin',
  'Frisch ans Werk',
]

const GREETINGS_DAY = [
  'Hallo',
  'Schön, dass du da bist',
  'Willkommen zurück',
]

const GREETINGS_EVENING = [
  'Guten Abend',
  'Noch fleißig?',
  'Schön, dass du reinschaust',
]

const SUBTITLES = [
  'Bereit für einen produktiven Tag?',
  'Was steht heute auf der Agenda?',
  'Zeit, dein Team zu stärken.',
  'Kleine Schritte, große Wirkung.',
  'Heute schon Feedback gegeben?',
  'Wie geht es deinem Team?',
  'Welche Ziele stehen an?',
  'Führung beginnt mit Zuhören.',
  'Ein guter Tag, um Großes zu bewegen.',
  'Dein Team zählt auf dich.',
  'Heute ist ein guter Tag für ein JF.',
  'Wer fragt, der führt.',
]

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  const pool = hour < 12 ? GREETINGS_MORNING : hour < 18 ? GREETINGS_DAY : GREETINGS_EVENING
  const dayIndex = new Date().getDate()
  return pool[dayIndex % pool.length]
}

function getTodaysSubtitle(): string {
  const today = new Date()
  const index = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate() + 7
  return SUBTITLES[index % SUBTITLES.length]
}

const STORAGE_KEY = 'teamlead-username'

export function WelcomeBanner() {
  const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const greeting = useMemo(() => getTimeBasedGreeting(), [])
  const subtitle = useMemo(() => getTodaysSubtitle(), [])
  const quote = useMemo(() => getTodaysQuote(), [])

  const isFirstVisit = !userName

  const startEditing = () => {
    setEditValue(userName)
    setIsEditing(true)
  }

  const saveName = () => {
    const trimmed = editValue.trim()
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
      setUserName(trimmed)
    }
    setIsEditing(false)
  }

  // First visit: show name input
  if (isFirstVisit && !isEditing) {
    return (
      <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Willkommen bei Unisono</h1>
        <p className="text-muted-foreground mb-6">Wie heißt du?</p>
        <div className="flex items-center gap-2 max-w-xs mx-auto">
          <Input
            placeholder="Dein Vorname"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && editValue.trim() && saveName()}
            autoFocus
            className="text-center"
          />
          <Button onClick={saveName} disabled={!editValue.trim()} size="sm">
            Los geht's
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {/* Greeting */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{greeting},</h1>
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && editValue.trim()) saveName()
                    if (e.key === 'Escape') setIsEditing(false)
                  }}
                  autoFocus
                  className="h-8 w-40 text-lg font-bold"
                />
                <button onClick={saveName} className="text-primary hover:text-primary/80" title="Speichern">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{greeting}, {userName}.</h1>
                <button onClick={startEditing} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Name ändern">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {!isEditing && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Quote */}
      {!isEditing && (
        <div className="mt-4 flex items-start gap-2.5 text-sm">
          <Quote className="h-4 w-4 text-primary/40 mt-0.5 flex-shrink-0" />
          <div>
            <p className="italic text-muted-foreground leading-relaxed">
              {quote.text}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              — {quote.author}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
