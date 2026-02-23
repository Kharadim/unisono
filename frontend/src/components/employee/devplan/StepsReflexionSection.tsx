import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, Save, BookOpen } from 'lucide-react'
import type { DevPlan } from '@/types'

interface StepsReflexionSectionProps {
  plan: DevPlan
  employeeId: number
}

const REFLEXION_FIELDS = [
  { key: 'reflexion_tasks' as const, label: 'Aufgabenschwerpunkte', placeholder: 'Welche Aufgaben standen im Fokus?' },
  { key: 'reflexion_successes' as const, label: 'Erfolge', placeholder: 'Was wurde besonders gut gemeistert?' },
  { key: 'reflexion_challenges' as const, label: 'Herausforderungen', placeholder: 'Welche Schwierigkeiten gab es?' },
  { key: 'reflexion_focus' as const, label: 'Fokusthemen nächstes Jahr', placeholder: 'Worauf soll der Fokus liegen?' },
] as const

export function StepsReflexionSection({ plan, employeeId }: StepsReflexionSectionProps) {
  const queryClient = useQueryClient()
  const hasContent = REFLEXION_FIELDS.some(f => plan[f.key])
  const [expanded, setExpanded] = useState(hasContent)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  const updatePlanMut = useMutation({
    mutationFn: (data: any) => api.updateDevPlan(plan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devplan', employeeId] })
      setDirty(false)
    },
  })

  const getValue = (key: string) =>
    editValues[key] !== undefined ? editValues[key] : plan[key as keyof DevPlan] as string || ''

  const handleChange = (key: string, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = () => {
    const data: Record<string, string> = {}
    for (const f of REFLEXION_FIELDS) {
      const val = getValue(f.key)
      data[f.key] = val
    }
    updatePlanMut.mutate(data)
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', !expanded && '-rotate-90')} />
        <BookOpen className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">Reflexion</span>
        {!expanded && hasContent && (
          <span className="text-xs text-muted-foreground/60 ml-1">— ausgefüllt</span>
        )}
      </button>

      {expanded && (
        <div className="ml-6 mt-3 space-y-3">
          {REFLEXION_FIELDS.map(field => (
            <div key={field.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {field.label}
              </label>
              <Textarea
                value={getValue(field.key)}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="text-sm"
              />
            </div>
          ))}
          {dirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updatePlanMut.isPending}
            >
              <Save className="h-3 w-3 mr-1" /> Speichern
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
