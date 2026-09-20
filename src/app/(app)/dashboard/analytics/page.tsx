'use client'

import { DataStatus } from '@/components/layout/data-status'
import { useUserData } from '@/components/providers/user-data-provider'
import { AnalyticsDashboard } from './analytics-dashboard'

export default function AnalyticsPage() {
  const { stats, isLoading, error } = useUserData()

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  if (!stats) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6">Analytics</h1><DataStatus />{!error && <p className="text-muted-foreground">Study data is unavailable. Sign in and try again.</p>}</div>
  }

  return <>{error && <div className="max-w-5xl mx-auto px-4 pt-8"><DataStatus /></div>}<AnalyticsDashboard stats={stats} /></>
}

function AnalyticsSkeleton() {
  return (
    <div role="status" aria-label="Loading analytics" className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
        <div>
          <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded mt-2 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
      <div className="h-48 rounded-2xl border border-border bg-card animate-pulse" />
    </div>
  )
}
