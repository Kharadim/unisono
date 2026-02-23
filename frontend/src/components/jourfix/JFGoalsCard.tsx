import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { goalStatusColor, goalStatusLabel, goalCategoryColor, goalCategoryLabel, cn } from '@/lib/utils'
import { Target } from 'lucide-react'
import type { Goal } from '@/types'

interface JFGoalsCardProps {
  goals: Goal[]
  goalChanges: Record<number, string>
  onToggle: (goalId: number) => void
}

export function JFGoalsCard({ goals, goalChanges, onToggle }: JFGoalsCardProps) {
  const getStatus = (goal: Goal) => goalChanges[goal.id] ?? goal.status

  const statusIcon = (status: string) => {
    switch (status) {
      case 'offen': return '\u{25CB}'
      case 'in_arbeit': return '\u{25D4}'
      case 'erreicht': return '\u{2714}'
      case 'nicht_erreicht': return '\u{2718}'
      default: return '\u{25CB}'
    }
  }

  if (goals.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" /> Aktive Ziele
          <Badge variant="secondary" className="text-xs">{goals.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {goals.map(goal => {
            const status = getStatus(goal)
            const changed = goalChanges[goal.id] !== undefined
            return (
              <div
                key={goal.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-md border text-sm',
                  changed && 'ring-2 ring-primary/20'
                )}
              >
                <button
                  onClick={() => onToggle(goal.id)}
                  className="mt-0.5 flex-shrink-0 text-base leading-none"
                  title="Status wechseln"
                >
                  {statusIcon(status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium', (status === 'erreicht' || status === 'nicht_erreicht') && 'line-through')}>
                    {goal.title}
                  </p>
                  <div className="flex gap-1 mt-0.5">
                    <Badge className={cn(goalCategoryColor(goal.category), 'text-[10px] px-1.5 py-0')}>
                      {goalCategoryLabel(goal.category)}
                    </Badge>
                    <Badge className={cn(goalStatusColor(status), 'text-[10px] px-1.5 py-0')}>
                      {goalStatusLabel(status)}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
