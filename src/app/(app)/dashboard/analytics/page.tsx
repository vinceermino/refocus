import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudyStats } from '@/actions/stats'
import { AnalyticsDashboard } from './analytics-dashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const stats = await getStudyStats()

  return <AnalyticsDashboard stats={stats} />
}
