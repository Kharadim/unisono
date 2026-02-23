import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading'
import { ArrowLeft, History } from 'lucide-react'
import type { Project, StatusHistoryEntry } from '@/types'

export function ProjectHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
  })

  const { data: history = [], isLoading } = useQuery<StatusHistoryEntry[]>({
    queryKey: ['project-history', projectId],
    queryFn: () => api.getProjectHistory(projectId),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Projekt
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Verlauf{project ? ` — ${project.name}` : ''}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{history.length} Änderungen</p>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="text-sm border-l-2 border-muted pl-3">
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)}</p>
                  <p>
                    <span className="font-medium">{h.field}</span>:{' '}
                    <span className="text-muted-foreground line-through">{h.old_value}</span>{' '}
                    → {h.new_value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Keine Änderungen bisher.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
