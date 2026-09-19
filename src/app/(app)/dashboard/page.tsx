'use client'

import { DataStatus } from '@/components/layout/data-status'
import { RoomCard } from '@/components/room/room-card'
import { DashboardActions } from './dashboard-actions'
import { Timer, Clock, Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useUserData } from '@/components/providers/user-data-provider'
import { PersonalTimer } from '@/components/timer/personal-timer'

export default function DashboardPage() {
  const { profile, rooms, isLoading, isRefreshingStats, error } = useUserData()

  if (isLoading && !profile && !error) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DataStatus />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Hello {profile?.username || "there"}!</h1>
        </div>
        <DashboardActions />
      </div>

      {/* Personal Timer */}
      <div className="mb-12">
        <PersonalTimer />
      </div>

      {/* Stats */}
      {(!error || profile) && <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Total Study Time</span>
              {isRefreshingStats && (
                <Loader2 className="h-3 w-3 animate-spin text-accent-primary" />
              )}
            </div>
            <p className={`text-2xl font-bold font-mono transition-all duration-300 ${isRefreshingStats ? 'opacity-50 blur-[1px] animate-pulse' : ''}`}>
              {formatTime(profile?.totalStudyTime ?? 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Active Rooms</span>
            </div>
            <p className="text-2xl font-bold">{rooms.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm">Live Sessions</span>
            </div>
            <p className="text-2xl font-bold">
              {rooms.filter((r) => r.timers.some((t) => t.status === 'running')).length}
            </p>
          </div>
        </div>

        {/* Rooms */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
          {rooms.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Timer className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rooms yet. Create or join one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Study Time</span>
          </div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="h-4 w-4" />
            <span className="text-sm">Active Rooms</span>
          </div>
          <div className="h-8 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm">Live Sessions</span>
          </div>
          <div className="h-8 w-12 bg-muted rounded animate-pulse" />
        </div>
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
