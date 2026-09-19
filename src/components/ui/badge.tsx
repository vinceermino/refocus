import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-accent-primary/10 text-accent-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-emerald-500/10 text-timer-running': variant === 'success',
          'bg-amber-500/10 text-timer-warning': variant === 'warning',
          'bg-red-500/10 text-timer-danger': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  )
}
