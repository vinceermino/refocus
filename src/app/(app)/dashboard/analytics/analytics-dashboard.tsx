'use client'

import Link from 'next/link'
import { memo } from 'react'
import { ProgressRing } from '@/components/timer/progress-ring'
import { ArrowLeft, Clock, Flame, Target, BarChart3, Trophy, Zap } from 'lucide-react'
import type { StudyStats } from '@/actions/stats'

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatDurationLong(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

// --- Stat Card Component ---
function StatCard({ icon: Icon, label, value, subValue }: {
  icon: typeof Clock
  label: string
  value: string
  subValue?: string
}) {
  return (
    <div className="min-w-0 py-4">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden="true" className="h-4 w-4" />{label}</dt>
      <dd className="mt-1 break-words text-2xl font-semibold tabular-nums">{value}</dd>
      {subValue && <dd className="mt-1 text-xs text-muted-foreground">{subValue}</dd>}
    </div>
  )
}

// --- Weekly Bar Chart ---
function WeeklyChart({ data }: { data: StudyStats['weeklyData'] }) {
  const maxSeconds = Math.max(...data.map(d => d.seconds), 1)
  const maxHours = Math.ceil(maxSeconds / 3600) || 1

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-accent-primary" />
        <h2 className="font-semibold text-lg">Last 7 Days</h2>
      </div>
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day, i) => {
          const heightPercent = maxSeconds > 0 ? (day.seconds / (maxHours * 3600)) * 100 : 0
          const isToday = i === data.length - 1
          return (
            <div key={day.fullDate} className="flex flex-col items-center gap-2 flex-1">
              {/* Value label */}
              <span className="text-xs text-muted-foreground tabular-nums">
                {day.seconds > 0 ? formatDuration(day.seconds) : '—'}
              </span>
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                <div
                  aria-hidden="true"
                  className="rounded-t-sm"
                  style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${Math.max(heightPercent, 2)}%`,
                    background: isToday
                      ? 'var(--accent-primary)'
                      : day.seconds > 0
                        ? 'var(--accent-primary)'
                        : 'var(--border)',
                    opacity: isToday ? 1 : 0.6,
                  }}
                />
              </div>
              {/* Day label */}
              <span className={`text-xs font-medium ${isToday ? 'text-accent-primary' : 'text-muted-foreground'}`}>
                {isToday ? 'Today' : day.date}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// --- Daily Goal Ring ---
function DailyGoalRing({ used, limit }: { used: number; limit: number }) {
  const progress = Math.min(1, used / limit)

  const getColor = () => {
    if (progress >= 1) return 'var(--timer-running)'
    if (progress >= 0.85) return 'var(--timer-warning)'
    return 'var(--accent-primary)'
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-accent-primary" />
        <h2 className="font-semibold text-lg">Today&apos;s Progress</h2>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="relative h-[180px] w-[180px]"><ProgressRing progress={progress} color={getColor()} /></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(progress * 100)}%</span>
            <span className="text-xs text-muted-foreground">{formatDuration(used)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>0h</span>
        <span>Daily Goal: {formatDuration(limit)}</span>
        <span>{formatDuration(limit)}</span>
      </div>
    </section>
  )
}

// --- Room Breakdown ---
function RoomBreakdown({ rooms }: { rooms: StudyStats['roomBreakdown'] }) {
  const total = rooms.reduce((sum, r) => sum + r.seconds, 0) || 1

  if (rooms.length === 0) {
    return (
      <div className="border-t border-border pt-6">
        <h2 className="font-semibold text-lg mb-4">Study by Room</h2>
        <p className="text-sm text-muted-foreground">No study sessions yet. Complete a focus session to see your study time here.</p>
        <Link href="/dashboard" className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-accent-primary underline underline-offset-4">Start a focus session</Link>
      </div>
    )
  }

  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-semibold text-lg mb-4">Study by Room</h2>
      <div className="space-y-3">
        {rooms.map((room) => {
          const percent = Math.round((room.seconds / total) * 100)
          return (
            <div key={room.roomName}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium truncate flex-1 mr-2">{room.roomName}</span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDuration(room.seconds)} · {percent}%
                </span>
              </div>
              <div aria-hidden="true" className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-transform duration-700 ease-out"
                  style={{ transform: `scaleX(${percent / 100})`, transformOrigin: 'left', backgroundColor: room.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// --- Main Dashboard ---
function AnalyticsDashboardView({ stats }: { stats: StudyStats }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" aria-label="Back to dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="minimal-optional text-sm text-muted-foreground">Your study performance overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <dl className="mb-8 grid grid-cols-1 gap-x-6 border-y border-border sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Today"
          value={formatDuration(stats.todaySeconds)}
          subValue={`of ${formatDuration(stats.goalMinutes * 60)} goal`}
        />
        <StatCard
          icon={Zap}
          label="Total Study Time"
          value={formatDurationLong(stats.totalSeconds)}
        />
        <StatCard
          icon={Trophy}
          label="Sessions"
          value={String(stats.totalSessions)}
          subValue={stats.averageSessionSeconds > 0 ? `Avg: ${formatDuration(stats.averageSessionSeconds)}` : undefined}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`}
          subValue={stats.longestStreak > 0 ? `Best: ${stats.longestStreak} days` : undefined}
        />
      </dl>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WeeklyChart data={stats.weeklyData} />
        <DailyGoalRing used={stats.todaySeconds} limit={stats.goalMinutes * 60} />
      </div>

      {/* Room Breakdown */}
      <RoomBreakdown rooms={stats.roomBreakdown} />
    </div>
  )
}

export const AnalyticsDashboard = memo(AnalyticsDashboardView)
