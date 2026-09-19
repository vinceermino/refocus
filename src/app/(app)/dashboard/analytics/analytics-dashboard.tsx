'use client'

import Link from 'next/link'
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
function StatCard({ icon: Icon, label, value, subValue, accentColor }: {
  icon: typeof Clock
  label: string
  value: string
  subValue?: string
  accentColor?: string
}) {
  return (
    <div className="relative overflow-hidden p-5 rounded-2xl border border-border bg-card group hover:border-accent-primary/30 transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: accentColor || 'var(--accent-primary)', transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-accent-primary/10">
          <Icon className="h-5 w-5 text-accent-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-bold mt-0.5 break-words">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

// --- Weekly Bar Chart ---
function WeeklyChart({ data }: { data: StudyStats['weeklyData'] }) {
  const maxSeconds = Math.max(...data.map(d => d.seconds), 1)
  const maxHours = Math.ceil(maxSeconds / 3600) || 1

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-accent-primary" />
        <h3 className="font-semibold text-lg">Last 7 Days</h3>
      </div>
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day, i) => {
          const heightPercent = maxSeconds > 0 ? (day.seconds / (maxHours * 3600)) * 100 : 0
          const isToday = i === data.length - 1
          return (
            <div key={day.fullDate} className="flex flex-col items-center gap-2 flex-1">
              {/* Value label */}
              <span className="text-[10px] text-muted-foreground font-mono">
                {day.seconds > 0 ? formatDuration(day.seconds) : '—'}
              </span>
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                <div
                  className="rounded-t-lg transition-all duration-700 ease-out"
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
    </div>
  )
}

// --- Daily Goal Ring ---
function DailyGoalRing({ used, limit }: { used: number; limit: number }) {
  const progress = Math.min(1, used / limit)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const getColor = () => {
    if (progress >= 1) return 'var(--timer-danger)'
    if (progress >= 0.85) return 'var(--timer-warning)'
    return 'var(--accent-primary)'
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-accent-primary" />
        <h3 className="font-semibold text-lg">Today&apos;s Progress</h3>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
            <circle
              cx="90" cy="90" r={radius}
              fill="none" stroke="var(--border)" strokeWidth="10" opacity={0.3}
            />
            <circle
              cx="90" cy="90" r={radius}
              fill="none" stroke={getColor()} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(progress * 100)}%</span>
            <span className="text-xs text-muted-foreground">{formatDuration(used)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>0h</span>
        <span>Daily Limit: {formatDuration(limit)}</span>
        <span>8h</span>
      </div>
    </div>
  )
}

// --- Room Breakdown ---
function RoomBreakdown({ rooms }: { rooms: StudyStats['roomBreakdown'] }) {
  const total = rooms.reduce((sum, r) => sum + r.seconds, 0) || 1

  if (rooms.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-border bg-card">
        <h3 className="font-semibold text-lg mb-4">Study by Room</h3>
        <p className="text-sm text-muted-foreground text-center py-8">No study sessions yet</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <h3 className="font-semibold text-lg mb-4">Study by Room</h3>
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
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percent}%`, backgroundColor: room.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Main Dashboard ---
export function AnalyticsDashboard({ stats }: { stats: StudyStats }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" aria-label="Back to dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your study performance overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Today"
          value={formatDuration(stats.todaySeconds)}
          subValue={`of ${formatDuration(stats.dailyLimit)} limit`}
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
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WeeklyChart data={stats.weeklyData} />
        <DailyGoalRing used={stats.todaySeconds} limit={stats.dailyLimit} />
      </div>

      {/* Room Breakdown */}
      <RoomBreakdown rooms={stats.roomBreakdown} />
    </div>
  )
}
