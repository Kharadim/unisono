import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Handshake, Users, Database, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'

interface WelcomeModalProps {
  onDone: (loadedDemo: boolean) => void
}

export function WelcomeModal({ onDone }: WelcomeModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const handleLoadDemo = async () => {
    setLoading(true)
    try {
      await api.loadDemoData()
      await queryClient.invalidateQueries()
      onDone(true)
    } catch (e) {
      alert('Fehler beim Laden der Demo-Daten: ' + (e as Error).message)
      setLoading(false)
    }
  }

  const handleEmpty = () => {
    onDone(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 animate-in fade-in duration-150" />
      <div className="relative z-50 w-full max-w-xl mx-4 rounded-xl bg-background shadow-2xl animate-in zoom-in-95 fade-in duration-150 overflow-hidden">
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

        {/* Options */}
        <div className="p-8">
          <p className="text-sm text-muted-foreground mb-5 text-center">
            Wie moechtest du starten?
          </p>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">Demo-Daten werden geladen...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Demo Data Option */}
              <button
                onClick={handleLoadDemo}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-1">Mit Beispieldaten starten</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    3 Mitarbeiter, 4 Projekte, Jour Fixes und mehr — ideal zum Kennenlernen.
                  </p>
                </div>
                <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Empfohlen <ArrowRight className="h-3 w-3" />
                </span>
              </button>

              {/* Empty Start Option */}
              <button
                onClick={handleEmpty}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-muted-foreground/30 hover:bg-accent/50 transition-all text-left"
              >
                <div className="rounded-full bg-muted p-3 group-hover:bg-muted/80 transition-colors">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-1">Leer starten</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direkt mit eigenen Daten loslegen — lege dein Team und Projekte selbst an.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Weiter <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
