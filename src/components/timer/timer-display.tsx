'use client'

import { useTimerAppearance } from '@/hooks/use-timer-appearance'
import { cn, formatTime } from '@/lib/utils'
import { ProgressRing } from '@/components/timer/progress-ring'

interface TimerDisplayProps {
  endsAt?: number | null
  displaySeconds: number
  progress: number  // 0 to 1
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
  mode: 'countdown' | 'stopwatch' | 'rest'
  dailyRemaining?: number
  dailyUsed?: number
}

export function TimerDisplay({ endsAt, displaySeconds, progress, isRunning, isPaused, isComplete, mode, dailyRemaining, dailyUsed }: TimerDisplayProps) {
  useTimerAppearance(isRunning, isPaused, isComplete)

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

  const endTimeStr = endsAt && isRunning && displaySeconds > 0
    ? `Ends at ${new Date(endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : ''

  return (
    <div
      data-state={isComplete ? 'complete' : isPaused ? 'paused' : isRunning ? 'running' : 'ready'}
      className="timer-display relative flex w-full max-w-[320px] flex-col items-center justify-center gap-4"
    >
      <div className="timer-face relative aspect-square w-full" aria-hidden="true">
        <ProgressRing progress={mode === 'stopwatch' ? 1 : progress} color={getColor()} className="timer-ring" />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ aspectRatio: '1 / 1', bottom: 'auto' }}>
        <span
          className={cn(
            'timer-digits font-mono text-[clamp(2.25rem,10vw,3.75rem)] font-bold tracking-tight transition-opacity duration-500 ease-in-out',
            isComplete && 'text-timer-danger',
            isPaused && 'text-muted-foreground',
          )}
          style={{ color: !isComplete && !isPaused ? `var(--timer-ink, ${getColor()})` : undefined }}
        >
          {formatTime(displaySeconds)}
        </span>
        <span role="status" className="timer-status text-sm text-muted-foreground mt-2 uppercase tracking-widest">
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
        <div className="timer-daily-quota w-full max-w-[280px] mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Daily: {formatTime(dailyUsed ?? 0)} / 8:00:00</span>
            <span>{dailyRemaining !== undefined ? `${formatTime(dailyRemaining)} left` : ''}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-transform duration-500 ease-out',
                dailyProgress >= 1 ? 'bg-timer-danger' : dailyProgress >= 0.85 ? 'bg-timer-warning' : 'bg-accent-primary'
              )}
              style={{ transform: `scaleX(${dailyProgress})`, transformOrigin: 'left' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
