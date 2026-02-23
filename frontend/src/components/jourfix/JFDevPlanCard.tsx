import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  cn, devPriorityColor, devPriorityLabel,
  measureStatusColor, measureStatusLabel, formatDate, isOverdue,
  performanceRatingLabel, performanceRatingColor,
  trainingStatusLabel, trainingStatusColor,
} from '@/lib/utils'
import { Sparkles, CheckCircle2, Circle, Loader2, ChevronDown, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import type { DevPlan } from '@/types'

interface JFDevPlanCardProps {
  devplan: DevPlan
  measureChanges: Record<number, string>
  trainingChanges: Record<number, string>
  onToggleMeasure: (measureId: number) => void
  onToggleTraining: (trainingId: number) => void
}

export function JFDevPlanCard({ devplan, measureChanges, trainingChanges, onToggleMeasure, onToggleTraining }: JFDevPlanCardProps) {
  const [collapsedAreas, setCollapsedAreas] = useState<Record<number, boolean>>({})
  const [showTrainings, setShowTrainings] = useState(true)

  const getMeasureStatus = (measureId: number, originalStatus: string) =>
    measureChanges[measureId] ?? originalStatus

  const getTrainingStatus = (trainingId: number, originalStatus: string) =>
    trainingChanges[trainingId] ?? originalStatus

  const measureIcon = (status: string) => {
    switch (status) {
      case 'offen': return <Circle className="h-3.5 w-3.5 text-muted-foreground" />
      case 'in_arbeit': return <Loader2 className="h-3.5 w-3.5 text-amber-500" />
      case 'erledigt': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
      default: return <Circle className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const activeMeasures = devplan.areas.flatMap(a => a.measures).filter(m => {
    const s = getMeasureStatus(m.id, m.status)
    return s !== 'erledigt'
  })

  const activeTrainings = devplan.trainings.filter(t => {
    const s = getTrainingStatus(t.id, t.status)
    return s !== 'abgeschlossen'
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Entwicklungsplan {devplan.period}
          {devplan.performance_rating && (
            <Badge className={cn(performanceRatingColor(devplan.performance_rating), 'text-[10px]')}>
              {performanceRatingLabel(devplan.performance_rating)}
            </Badge>
          )}
          {activeMeasures.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">{activeMeasures.length} offen</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {devplan.areas.length > 0 ? (
          <div className="space-y-2">
            {devplan.areas.map(area => {
              const isCollapsed = collapsedAreas[area.id] ?? false
              const areaActiveMeasures = area.measures.filter(m => {
                const s = getMeasureStatus(m.id, m.status)
                return s !== 'erledigt'
              })

              return (
                <div key={area.id}>
                  <button
                    onClick={() => setCollapsedAreas(prev => ({ ...prev, [area.id]: !isCollapsed }))}
                    className="flex items-center gap-1.5 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn('h-3 w-3 transition-transform', isCollapsed && '-rotate-90')} />
                    {area.title}
                    <Badge className={cn(devPriorityColor(area.priority), 'text-[10px] px-1.5 py-0 ml-1')}>
                      {devPriorityLabel(area.priority)}
                    </Badge>
                    {areaActiveMeasures.length > 0 && (
                      <span className="text-muted-foreground/60 ml-auto">{areaActiveMeasures.length}</span>
                    )}
                  </button>
                  {!isCollapsed && area.measures.length > 0 && (
                    <div className="space-y-1 mt-1 ml-4">
                      {area.measures.map(measure => {
                        const status = getMeasureStatus(measure.id, measure.status)
                        const changed = measureChanges[measure.id] !== undefined
                        const overdue = status !== 'erledigt' && isOverdue(measure.due_date)

                        return (
                          <div
                            key={measure.id}
                            className={cn(
                              'flex items-center gap-1.5 p-1.5 rounded text-xs',
                              changed && 'ring-1 ring-primary/20',
                              status === 'erledigt' && 'opacity-50'
                            )}
                          >
                            <button
                              onClick={() => onToggleMeasure(measure.id)}
                              className="flex-shrink-0"
                              title="Status wechseln"
                            >
                              {measureIcon(status)}
                            </button>
                            <span className={cn(
                              'flex-1',
                              status === 'erledigt' && 'line-through'
                            )}>
                              {measure.content}
                            </span>
                            {measure.due_date && (
                              <span className={cn(
                                'text-[10px]',
                                overdue ? 'text-destructive' : 'text-muted-foreground'
                              )}>
                                {formatDate(measure.due_date)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            Keine Entwicklungsfelder definiert.
          </p>
        )}

        {/* Trainings */}
        {devplan.trainings.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={() => setShowTrainings(!showTrainings)}
              className="flex items-center gap-1.5 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform', !showTrainings && '-rotate-90')} />
              <GraduationCap className="h-3.5 w-3.5" />
              Weiterbildung
              {activeTrainings.length > 0 && (
                <span className="text-muted-foreground/60 ml-auto">{activeTrainings.length}</span>
              )}
            </button>
            {showTrainings && (
              <div className="space-y-1 ml-4">
                {devplan.trainings.map(training => {
                  const status = getTrainingStatus(training.id, training.status)
                  const changed = trainingChanges[training.id] !== undefined

                  return (
                    <div
                      key={training.id}
                      className={cn(
                        'flex items-center gap-1.5 p-1.5 rounded text-xs',
                        changed && 'ring-1 ring-primary/20',
                        status === 'abgeschlossen' && 'opacity-50'
                      )}
                    >
                      <button
                        onClick={() => onToggleTraining(training.id)}
                        className="flex-shrink-0"
                        title="Status wechseln: Vorgeschlagen → Genehmigt → Abgeschlossen"
                      >
                        <Badge className={cn(trainingStatusColor(status), 'text-[10px] px-1.5 py-0 cursor-pointer')}>
                          {trainingStatusLabel(status)}
                        </Badge>
                      </button>
                      <span className={cn(
                        'flex-1',
                        status === 'abgeschlossen' && 'line-through'
                      )}>
                        {training.content}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
