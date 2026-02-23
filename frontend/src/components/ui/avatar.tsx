import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getAuthToken, getPhotoUrl } from '@/lib/api'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return
    let revoked = false
    const token = getAuthToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(getPhotoUrl(src), { headers })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.blob()
      })
      .then(blob => {
        if (!revoked) setBlobUrl(URL.createObjectURL(blob))
      })
      .catch(() => {
        if (!revoked) setBlobUrl(null)
      })

    return () => {
      revoked = true
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    }
  }, [src])

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (src && blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium',
        sizeClasses[size],
        className
      )}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  )
}
