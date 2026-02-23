import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TourStep {
  id: string
  target: string | null
  title: string
  description: string
  icon: LucideIcon
  position?: 'right' | 'bottom'
}

interface OnboardingTourProps {
  steps: TourStep[]
  tourKey: string
  onDone: () => void
}

export function OnboardingTour({ steps, tourKey, onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const current = steps[step]
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  const finish = useCallback(() => {
    localStorage.setItem(tourKey, 'true')
    onDone()
  }, [tourKey, onDone])

  const next = useCallback(() => {
    if (isLast) {
      finish()
    } else {
      setStep(s => s + 1)
    }
  }, [isLast, finish])

  const prev = useCallback(() => {
    if (!isFirst) setStep(s => s - 1)
  }, [isFirst])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [finish, next, prev])

  // Find and highlight target element
  useEffect(() => {
    if (!current.target) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null
    if (!el) {
      setTargetRect(null)
      return
    }

    el.classList.add('tour-highlight')

    // Only scroll if element is not already visible (sticky elements are visually in place)
    const rect = el.getBoundingClientRect()
    const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!inViewport) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    // Wait for scroll + layout
    const timer = setTimeout(() => {
      setTargetRect(el.getBoundingClientRect())
    }, 350)

    return () => {
      clearTimeout(timer)
      el.classList.remove('tour-highlight')
    }
  }, [step, current.target])

  // Recalculate position on resize
  useEffect(() => {
    if (!current.target) return

    const handler = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null
      if (el) setTargetRect(el.getBoundingClientRect())
    }

    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [current.target])

  const Icon = current.icon

  // Calculate tooltip position — auto-flip when overflowing viewport
  const TOOLTIP_HEIGHT = 220 // approximate max height of tooltip card
  const TOOLTIP_WIDTH = 320  // w-80 = 20rem = 320px
  const GAP = 16

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || !current.target) {
      // Centered
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const vh = window.innerHeight
    const vw = window.innerWidth

    if (current.position === 'right') {
      // Check if tooltip fits to the right, otherwise place below
      const fitsRight = targetRect.right + GAP + TOOLTIP_WIDTH < vw
      if (fitsRight) {
        const top = Math.min(Math.max(GAP, targetRect.top), vh - TOOLTIP_HEIGHT - GAP)
        return { position: 'fixed', top, left: targetRect.right + GAP }
      }
      // Fallback: below or above
      const fitsBelow = targetRect.bottom + GAP + TOOLTIP_HEIGHT < vh
      if (fitsBelow) {
        return { position: 'fixed', top: targetRect.bottom + GAP, left: Math.max(GAP, targetRect.left) }
      }
      return { position: 'fixed', top: targetRect.top - TOOLTIP_HEIGHT - GAP, left: Math.max(GAP, targetRect.left) }
    }

    // bottom — check if tooltip fits below, otherwise place above
    const fitsBelow = targetRect.bottom + GAP + TOOLTIP_HEIGHT < vh
    const left = Math.min(Math.max(GAP, targetRect.left), vw - TOOLTIP_WIDTH - GAP)

    if (fitsBelow) {
      return { position: 'fixed', top: targetRect.bottom + GAP, left }
    }

    // Place above the target
    return { position: 'fixed', top: targetRect.top - TOOLTIP_HEIGHT - GAP, left }
  }

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300"
        onClick={next}
      />

      {/* Highlight ring on target */}
      {targetRect && current.target && (
        <div
          className="fixed z-[61] pointer-events-none rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="z-[62] w-80 bg-card rounded-xl shadow-2xl border p-5 animate-in zoom-in-95 duration-150"
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={finish}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          title="Tour beenden"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg pr-6">{current.title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {current.description}
        </p>

        {/* Footer: Counter + Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {step + 1} von {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {!isFirst && !isLast && (
              <Button variant="ghost" size="sm" onClick={finish} className="text-xs text-muted-foreground">
                Ueberspringen
              </Button>
            )}
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? 'Tour beenden' : isFirst ? 'Los geht\'s' : (
                <>
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
