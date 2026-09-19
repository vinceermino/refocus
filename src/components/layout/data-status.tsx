'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useUserData } from '@/components/providers/user-data-provider'

export function DataStatus() {
  const { error, profile, refreshAll, isLoading } = useUserData()
  if (!error) return null

  return (
    <div role="alert" className="mb-6 rounded-xl border border-timer-danger/30 bg-card p-4">
      <p className="text-sm text-timer-danger">{error}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => void refreshAll()} disabled={isLoading}>
          {isLoading ? 'Retrying...' : 'Try again'}
        </Button>
        {!profile && <Link href="/login" className="text-sm font-medium text-accent-primary underline underline-offset-4">Sign in</Link>}
      </div>
    </div>
  )
}
