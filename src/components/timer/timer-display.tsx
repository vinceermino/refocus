'use client'

import { useClock } from '@/hooks/use-clock'
import { cn, formatTime } from '@/lib/utils'

interface TimerDisplayProps {
  displaySeconds: number
  progress: number  // 0 to 1
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
  mode: 'countdown' | 'stopwatch' | 'rest'
  dailyRemaining?: number
  dailyUsed?: number
}

export function TimerDisplay({ displaySeconds, progress, isRunning, isPaused, isComplete, mode, dailyRemaining, dailyUsed }: TimerDisplayProps) {
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = (mode === 'countdown' || mode === 'rest')
    ? circumference * (1 - progress)
    : 0

  // Color based on countdown progress
  const getColor = () => {
    if (isComplete) return 'var(--timer-danger)'
    if (isPaused) return 'var(--muted-foreground)'
    if (mode === 'stopwatch') return 'var(--timer-running)'
    if (mode === 'rest') return 'var(--timer-running)'
    if (progress > 0.85) return 'var(--timer-danger)'
    if (progress > 0.65) return 'var(--timer-warning)'
    return 'var(--timer-running)'
  }

  const dailyLimit = 8 * 60 * 60
  const dailyProgress = dailyUsed !== undefined ? Math.min(1, dailyUsed / dailyLimit) : 0
  const showDailyQuota = dailyUsed !== undefined

  const now = useClock(isRunning)
  const endTimeStr = now && isRunning && mode !== 'stopwatch' && displaySeconds > 0
    ? `Ends at ${new Date(now + displaySeconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : ''

  return (
    <div className={cn(
      'relative flex w-full max-w-[320px] flex-col items-center justify-center gap-4'
    )}>
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        aria-hidden="true"
        className="h-auto w-full transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
          opacity={0.3}
        />
        {/* Progress circle */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ aspectRatio: '1 / 1', bottom: 'auto' }}>
        <span
          className={cn(
            'font-mono text-[clamp(2.25rem,10vw,3.75rem)] font-bold tracking-tight transition-colors duration-500 ease-in-out',
            isComplete && 'text-timer-danger',
            isPaused && 'text-muted-foreground',
          )}
          style={{ color: !isComplete && !isPaused ? getColor() : undefined }}
        >
          {formatTime(displaySeconds)}
        </span>
        <span role="status" className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">
          {isComplete ? 'Complete!' : isPaused ? 'Paused' : isRunning ? (mode === 'countdown' ? 'Focusing' : mode === 'rest' ? 'Resting' : 'Studying') : 'Ready'}
        </span>
        {endTimeStr && (
          <span className="minimal-optional text-xs text-muted-foreground mt-1 font-medium bg-muted/50 px-2 py-0.5 rounded-full">
            {endTimeStr}
          </span>
        )}
      </div>

      {/* Daily quota indicator */}
      {showDailyQuota && (
        <div className="w-full max-w-[280px] mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Daily: {formatTime(dailyUsed ?? 0)} / 8:00:00</span>
            <span>{dailyRemaining !== undefined ? `${formatTime(dailyRemaining)} left` : ''}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                dailyProgress >= 1 ? 'bg-timer-danger' : dailyProgress >= 0.85 ? 'bg-timer-warning' : 'bg-accent-primary'
              )}
              style={{ width: `${Math.min(100, dailyProgress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
