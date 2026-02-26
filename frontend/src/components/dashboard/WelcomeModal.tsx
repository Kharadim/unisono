import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DEMO_TEMPLATES } from '@/lib/templates'
import { Handshake, TrendingUp, Wrench, Calculator, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'

interface WelcomeModalProps {
  onDone: (loadedDemo: boolean) => void
}

const TEMPLATE_ICONS = {
  marketing: TrendingUp,
  handwerk: Wrench,
  kanzlei: Calculator,
} as const

export function WelcomeModal({ onDone }: WelcomeModalProps) {
  const queryClient = useQueryClient()
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null)

  const handleLoadTemplate = async (key: string) => {
    setLoadingTemplate(key)
    try {
      await api.loadDemoData(key)
      await queryClient.refetchQueries()
      onDone(true)
    } catch (e) {
      alert('Fehler beim Laden der Demo-Daten: ' + (e as Error).message)
      setLoadingTemplate(null)
    }
  }

  const handleEmpty = async () => {
    try {
      await api.dismissWelcome()
    } catch {
      // ignore
    }
    onDone(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 animate-in fade-in duration-150" />
      <div className="relative z-50 w-full max-w-3xl mx-4 rounded-xl bg-background shadow-2xl animate-in zoom-in-95 fade-in duration-150 overflow-hidden">
        {/* Header */}
        <div className="bg-sidebar-bg px-8 py-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sidebar-active mb-4">
            <Handshake className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Willkommen bei Unisono</h1>
          <p className="text-sidebar-foreground text-sm">
            Dein lokales Management-Tool fuer strukturierte 1:1-Gespraeche, Projekte und Mitarbeiterentwicklung.
          </p>
        </div>

        {/* Template Selection */}
        <div className="p-8">
          <p className="text-sm text-muted-foreground mb-5 text-center">
            Waehle ein Beispiel-Szenario zum Kennenlernen:
          </p>

          {loadingTemplate ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">
                Beispieldaten werden geladen...
              </p>
            </div>
          ) : (
            <>
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
              <div className="text-center mt-5">
                <button
                  onClick={handleEmpty}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Ohne Beispieldaten starten
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
