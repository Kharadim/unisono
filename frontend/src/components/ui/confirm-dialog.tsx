import { Dialog, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {variant === 'danger' && <AlertTriangle className="h-5 w-5 text-destructive" />}
          {title}
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
