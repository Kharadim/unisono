import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  text?: string
}

export function LoadingSpinner({ text = 'Laden...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
