import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, isOverdue, cn } from '@/lib/utils'
import { ClipboardList, Handshake, Target } from 'lucide-react'
import type { Agreement } from '@/types'

interface DevMeasure {
  id: number
  content: string
  status: string
  due_date: string | null
}

interface DevArea {
  id: number
  title: string
  measures: DevMeasure[]
}

interface JFAgreementsCardProps {
  agreements: Agreement[]
  agreementChanges: Record<number, string>
  onToggle: (agreementId: number) => void
  devAreas?: DevArea[]
  measureChanges?: Record<number, string>
  onToggleMeasure?: (measureId: number) => void
}

export function JFAgreementsCard({ agreements, agreementChanges, onToggle, devAreas, measureChanges, onToggleMeasure }: JFAgreementsCardProps) {
  const getAgreementStatus = (a: Agreement) => agreementChanges[a.id] ?? a.status
  const getMeasureStatus = (m: DevMeasure) => measureChanges?.[m.id] ?? m.status

  // Collect open measures from devAreas
  const openMeasures: (DevMeasure & { area_title: string })[] = []
  if (devAreas) {
    for (const area of devAreas) {
      for (const m of area.measures) {
        if (getMeasureStatus(m) !== 'erledigt') {
          openMeasures.push({ ...m, area_title: area.title })
        }
      }
    }
  }

  const totalItems = agreements.length + openMeasures.length
  if (totalItems === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Offene Punkte
          <Badge variant="secondary" className="text-xs">{totalItems}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Agreements */}
        {agreements.length > 0 && (
          <div>
            {openMeasures.length > 0 && (
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Handshake className="h-3 w-3" /> Vereinbarungen
              </p>
            )}
            <div className="space-y-1.5">
              {agreements.map(agreement => {
                const status = getAgreementStatus(agreement)
                const changed = agreementChanges[agreement.id] !== undefined
                const overdue = status === 'offen' && agreement.due_date && isOverdue(agreement.due_date)
                return (
                  <div
                    key={agreement.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-md border text-sm',
                      overdue && 'border-destructive/50 bg-destructive/5',
                      changed && 'ring-2 ring-primary/20'
                    )}
                  >
                    <button
                      onClick={() => onToggle(agreement.id)}
                      className="mt-0.5 flex-shrink-0 text-base leading-none"
                      title="Status wechseln"
                    >
                      {status === 'erledigt' ? '\u{2714}' : '\u{25CB}'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium', status === 'erledigt' && 'line-through')}>
                        {agreement.content}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {agreement.project_name && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {agreement.project_name}
                          </Badge>
                        )}
                        {agreement.due_date && (
                          <span className={cn('text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            {overdue && '\u26A0 '}Fällig: {formatDate(agreement.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dev Measures */}
        {openMeasures.length > 0 && (
          <div>
            {agreements.length > 0 && (
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Target className="h-3 w-3" /> Massnahmen
              </p>
            )}
            <div className="space-y-1.5">
              {openMeasures.map(m => {
                const status = getMeasureStatus(m)
                const changed = measureChanges?.[m.id] !== undefined
                const overdue = status !== 'erledigt' && m.due_date && isOverdue(m.due_date)
                return (
                  <div
                    key={`m-${m.id}`}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-md border text-sm',
                      overdue && 'border-destructive/50 bg-destructive/5',
                      changed && 'ring-2 ring-primary/20'
                    )}
                  >
                    <button
                      onClick={() => onToggleMeasure?.(m.id)}
                      className="mt-0.5 flex-shrink-0 text-base leading-none"
                      title="Status wechseln"
                    >
                      {status === 'erledigt' ? '\u{2714}' : '\u{25CB}'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium', status === 'erledigt' && 'line-through')}>
                        {m.content}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {m.area_title}
                        </Badge>
                        {m.due_date && (
                          <span className={cn('text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            {overdue && '\u26A0 '}Fällig: {formatDate(m.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
