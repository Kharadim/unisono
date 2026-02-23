import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface JFAgreement {
  content: string
  project_id: number | null
  due_date: string
}

interface JFAgreementFormProps {
  projectId: number
  agreements: JFAgreement[]
  onAdd: (agreement: JFAgreement) => void
  onRemove: (index: number) => void
}

export function JFAgreementForm({ projectId, agreements, onAdd, onRemove }: JFAgreementFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')

  const projectAgreements = agreements.filter(a => a.project_id === projectId)

  const handleAdd = () => {
    if (!content.trim()) return
    onAdd({ content: content.trim(), project_id: projectId, due_date: dueDate })
    setContent('')
    setDueDate('')
    setShowForm(false)
  }

  return (
    <div>
      {/* Existing agreements for this project */}
      {projectAgreements.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {projectAgreements.map((ag, i) => {
            const globalIndex = agreements.findIndex(a => a === ag)
            return (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-dashed border-primary/30 bg-primary/5 text-sm">
                <span className="flex-1">{ag.content}</span>
                {ag.due_date && <span className="text-xs text-muted-foreground">{ag.due_date}</span>}
                <button onClick={() => onRemove(globalIndex)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Vereinbarung..."
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && content.trim() && handleAdd()}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-36 h-8 text-sm"
          />
          <Button size="sm" onClick={handleAdd} disabled={!content.trim()} className="h-8">OK</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-8">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => setShowForm(true)}>
          <Plus className="h-3 w-3 mr-1" /> Vereinbarung
        </Button>
      )}
    </div>
  )
}
