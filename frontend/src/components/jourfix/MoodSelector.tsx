import { MOOD_EMOJIS, MOOD_LABELS, cn } from '@/lib/utils'

interface MoodSelectorProps {
  value: number | null
  onChange: (mood: number) => void
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(mood => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          className={cn(
            'text-xl p-1.5 rounded-md transition-all',
            value === mood
              ? 'bg-primary/10 scale-110'
              : 'opacity-40 hover:opacity-80 hover:bg-muted'
          )}
          title={MOOD_LABELS[mood]}
        >
          {MOOD_EMOJIS[mood]}
        </button>
      ))}
    </div>
  )
}
