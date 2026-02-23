import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
  className?: string
}

export function Dialog({ open, onClose, children, wide, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 animate-in fade-in duration-150" onClick={onClose} />
      <div className={cn(
        'relative z-50 w-full mx-4 max-h-[85vh] overflow-auto rounded-xl bg-background p-6 shadow-xl animate-in zoom-in-95 fade-in duration-150',
        wide ? 'max-w-2xl' : 'max-w-lg',
        className
      )}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 opacity-50 hover:opacity-100 hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}
