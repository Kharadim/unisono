import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MOOD_EMOJIS, MOOD_LABELS, cn } from '@/lib/utils'
import type { JourFixSession } from '@/types'

interface MoodTrendProps {
  employeeId: number
}

export function MoodTrend({ employeeId }: MoodTrendProps) {
  const { data: history = [] } = useQuery<JourFixSession[]>({
    queryKey: ['jourfix-history', employeeId],
    queryFn: () => api.getJourfixHistory(employeeId),
  })

  // Last 8 sessions with mood data
  const moodSessions = history
    .filter(s => s.mood != null)
    .slice(0, 8)
    .reverse()

  if (moodSessions.length === 0) return null

  return (
    <div className="flex items-center gap-1" title="Stimmungsverlauf (letzte JFs)">
      {moodSessions.map((s, i) => (
        <span
          key={s.id}
          className={cn(
            'text-base cursor-default',
            i < moodSessions.length - 1 && 'opacity-50'
          )}
          title={`${MOOD_LABELS[s.mood!]} — ${s.completed_at?.split('T')[0] || ''}`}
        >
          {MOOD_EMOJIS[s.mood!]}
        </span>
      ))}
    </div>
  )
}
