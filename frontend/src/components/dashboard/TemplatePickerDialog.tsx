import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DEMO_TEMPLATES } from '@/lib/templates'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrendingUp, Wrench, Calculator, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'

interface TemplatePickerDialogProps {
  open: boolean
  onClose: () => void
}

const TEMPLATE_ICONS = {
  marketing: TrendingUp,
  handwerk: Wrench,
  kanzlei: Calculator,
} as const

export function TemplatePickerDialog({ open, onClose }: TemplatePickerDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null)

  const handleLoadTemplate = async (key: string) => {
    setLoadingTemplate(key)
    try {
      await api.loadDemoData(key)
      await queryClient.invalidateQueries()
      onClose()
      navigate('/')
    } catch (e) {
      alert('Fehler beim Laden der Demo-Daten: ' + (e as Error).message)
    } finally {
      setLoadingTemplate(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Beispieldaten laden</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground mb-5">
        Waehle ein Szenario — die Daten koennen jederzeit wieder entfernt werden.
      </p>

      {loadingTemplate ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground">
            Beispieldaten werden geladen...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_TEMPLATES.map((tpl) => {
            const Icon = TEMPLATE_ICONS[tpl.icon]
            return (
              <button
                key={tpl.key}
                onClick={() => handleLoadTemplate(tpl.key)}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className={`rounded-full p-3 ${tpl.iconBgClass} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${tpl.colorClass}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-0.5">{tpl.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{tpl.subtitle}</p>
                  <ul className="text-xs text-muted-foreground leading-relaxed space-y-0.5 text-left">
                    {tpl.bullets.map((b, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-muted-foreground/50 mt-px">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Auswaehlen <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Dialog>
  )
}
