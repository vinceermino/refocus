'use client'

import { DataStatus } from '@/components/layout/data-status'
import { RoomCard } from '@/components/room/room-card'
import { DashboardActions } from './dashboard-actions'
import { Timer, Clock, Loader2, Flame } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useUserData } from '@/components/providers/user-data-provider'
import { PersonalTimer } from '@/components/timer/personal-timer'
import { ProfileLink } from '@/components/profile/profile-link'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile, rooms, stats, isLoading, isRefreshingStats, error } = useUserData()

  if (isLoading && !profile && !error) {
    return <DashboardSkeleton />
  }

  return (
    <div className="dashboard-shell max-w-4xl mx-auto px-4 py-8">
      <DataStatus />
      {/* Header */}
      <div className="dashboard-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold break-words"><MinimalModeText short="Dashboard">Hello {profile ? <ProfileLink userId={profile.id} username={profile.username} /> : 'there'}!</MinimalModeText></h1>
          <p className="she-only dashboard-note">A little space to grow, one quiet moment at a time.</p>
          <p className="he-only dashboard-note">Steady attention. One moment, one task.</p>
          {stats && <p title="Consecutive days meeting your focus goal" tabIndex={0} className="minimal-optional mt-2 flex items-center gap-1 text-sm text-muted-foreground"><Flame className="h-4 w-4 text-orange-500" />{stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}</p>}
        </div>
        <DashboardActions />
      </div>

      {/* Personal Timer */}
      <div className="mb-12">
        <PersonalTimer />
      </div>

      {/* Stats */}
      {(!error || profile) && <>
        <dl aria-label="Study overview" className="study-overview minimal-optional mb-8 grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-4 sm:pr-6">
            <dt className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Total Study Time</span>
              {isRefreshingStats && (
                <span role="status" aria-label="Refreshing study totals"><Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" /></span>
              )}
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {formatTime(profile?.totalStudyTime ?? 0)}
            </dd>
          </div>
          <div className="py-4 sm:px-6">
            <dt className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Active Rooms</span>
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">{rooms.length}</dd>
          </div>
          <div className="py-4 sm:pl-6">
            <dt className="flex items-center gap-2 text-muted-foreground mb-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-timer-running" />
              <span className="text-sm">Live Sessions</span>
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {rooms.filter((r) => r.timers.some((t) => t.status === 'running')).length}
            </dd>
          </div>
        </dl>

        {/* Rooms */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
          {rooms.length === 0 ? (
            <div className="empty-rooms text-center py-12 border border-dashed border-border rounded-xl">
              <Timer className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground"><MinimalModeText short="No rooms yet.">No rooms yet. Create or join one to get started!</MinimalModeText></p>
              <Link href="/discover" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Discover rooms</Link>
            </div>
          ) : (
            <div className="room-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </>}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="h-9 w-48 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      <div aria-hidden="true" className="mx-auto mb-12 w-full max-w-md space-y-6">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-[560px] rounded-xl bg-muted animate-pulse" />
      </div>
      <div aria-hidden="true" className="minimal-optional mb-8 grid grid-cols-1 gap-6 border-y border-border py-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => <div key={i} className="space-y-2"><div className="h-4 w-28 rounded bg-muted animate-pulse" /><div className="h-8 w-20 rounded bg-muted animate-pulse" /></div>)}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
