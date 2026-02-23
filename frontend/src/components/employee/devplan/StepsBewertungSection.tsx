import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  cn, performanceRatingLabel, performanceRatingColor,
  talentPoolLabel,
} from '@/lib/utils'
import { ChevronDown, Award } from 'lucide-react'
import type { DevPlan } from '@/types'

interface StepsBewertungSectionProps {
  plan: DevPlan
  employeeId: number
}

const RATINGS = [
  { value: 'uebertroffen', label: 'Übertroffen' },
  { value: 'voll', label: 'Voll erfüllt' },
  { value: 'teilweise', label: 'Teilweise erfüllt' },
  { value: 'unzureichend', label: 'Unzureichend' },
] as const

const TALENT_OPTIONS = [
  { value: 'kein_wert', label: 'Kein Wert' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertikal', label: 'Vertikal' },
] as const

export function StepsBewertungSection({ plan, employeeId }: StepsBewertungSectionProps) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const updatePlanMut = useMutation({
    mutationFn: (data: any) => api.updateDevPlan(plan.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devplan', employeeId] }),
  })

  const saveField = (field: string, value: string | number | null) => {
    updatePlanMut.mutate({ [field]: value })
  }

  const hasContent = plan.performance_rating || plan.change_interest || plan.talent_pool || plan.mobility_willing !== null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', !expanded && '-rotate-90')} />
        <Award className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-700">Leistung & Potenzial</span>
        {!expanded && plan.performance_rating && (
          <Badge className={cn(performanceRatingColor(plan.performance_rating), 'text-xs ml-1')}>
            {performanceRatingLabel(plan.performance_rating)}
          </Badge>
        )}
        {!expanded && !plan.performance_rating && hasContent && (
          <span className="text-xs text-muted-foreground/60 ml-1">— teilweise ausgefüllt</span>
        )}
      </button>

      {expanded && (
        <div className="ml-6 mt-3 space-y-5">
          {/* Leistungseinschätzung */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Leistungseinschätzung
            </label>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => saveField('performance_rating', plan.performance_rating === r.value ? '' : r.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    plan.performance_rating === r.value
                      ? performanceRatingColor(r.value)
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Veränderungsinteresse */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Veränderungsinteresse
            </label>
            <div className="space-y-2">
              <button
                onClick={() => saveField('change_interest', plan.change_interest === 'option_a' ? '' : 'option_a')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
                  plan.change_interest === 'option_a'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <span className="font-medium">Option A</span> — Verbleib auf aktueller Position
              </button>
              <button
                onClick={() => saveField('change_interest', plan.change_interest === 'option_b' ? '' : 'option_b')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
                  plan.change_interest === 'option_b'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <span className="font-medium">Option B</span> — Veränderungsinteresse
              </button>
            </div>
            {plan.change_interest === 'option_b' && (
              <div className="mt-2">
                <Textarea
                  value={plan.change_interest_details}
                  onChange={e => saveField('change_interest_details', e.target.value)}
                  placeholder="Gewünschte Veränderung beschreiben..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Talent Pool */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Talent Pool
            </label>
            <div className="flex flex-wrap gap-2">
              {TALENT_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => saveField('talent_pool', plan.talent_pool === t.value ? '' : t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    plan.talent_pool === t.value
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobilität */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Mobilität
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => saveField('mobility_willing', plan.mobility_willing === 1 ? null : 1)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                  plan.mobility_willing === 1
                    ? 'bg-green-100 text-green-700'
                    : 'bg-background hover:bg-muted text-muted-foreground'
                )}
              >
                Ja
              </button>
              <button
                onClick={() => saveField('mobility_willing', plan.mobility_willing === 0 ? null : 0)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                  plan.mobility_willing === 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-background hover:bg-muted text-muted-foreground'
                )}
              >
                Nein
              </button>
            </div>
            {plan.mobility_willing === 1 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {(['regional', 'national', 'international'] as const).map(scope => (
                    <button
                      key={scope}
                      onClick={() => saveField('mobility_scope', plan.mobility_scope === scope ? '' : scope)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize',
                        plan.mobility_scope === scope
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-background hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </button>
                  ))}
                </div>
                <Input
                  value={plan.mobility_locations}
                  onChange={e => saveField('mobility_locations', e.target.value)}
                  placeholder="Bevorzugte Standorte..."
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
