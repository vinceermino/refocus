import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  fallback: string
  size?: 'sm' | 'default' | 'lg'
  showOnline?: boolean
}

export function Avatar({ src, fallback, size = 'default', showOnline, className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <div className={cn('relative', className)} {...props}>
      <div
        className={cn(
          'rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-medium overflow-hidden',
          sizeClasses[size]
        )}
      >
        {src ? (
          // Avatars can be external URLs; preserve that contract without a broad image-host allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={fallback} width={size === 'sm' ? 32 : size === 'lg' ? 48 : 40} height={size === 'sm' ? 32 : size === 'lg' ? 48 : 40} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          fallback.charAt(0).toUpperCase()
        )}
      </div>
      {showOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
      )}
    </div>
  )
}
