'use client'

import { AnalyticsSkeleton } from '@/components/layout/page-skeletons'

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
