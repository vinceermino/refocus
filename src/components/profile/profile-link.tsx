'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ProfileLink({ userId, username, avatar = false, compact = false, children, className }: {
  userId: string; username: string; avatar?: boolean; compact?: boolean; children?: ReactNode; className?: string
}) {
  return <Link href={`/profile/${encodeURIComponent(userId)}`} aria-label={`View ${username}'s profile`}
    className={cn('inline-flex min-w-0 max-w-full items-center gap-2 rounded-md align-middle hover:underline underline-offset-4', className)}
    onKeyDown={event => {
      if (event.key === ' ' && !event.repeat) { event.preventDefault(); event.currentTarget.click() }
    }}>
    {avatar && <Avatar fallback={username} size="sm" aria-hidden="true" className="shrink-0" />}
    <span className={cn('truncate', compact && 'hidden md:inline')}>{children ?? username}</span>
  </Link>
}
