'use client'

import { cn, formatTime } from '@/lib/utils'

interface TimerDisplayProps {
  displaySeconds: number
  progress: number  // 0 to 1
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
  mode: 'countdown' | 'stopwatch'
}

export function TimerDisplay({ displaySeconds, progress, isRunning, isPaused, isComplete, mode }: TimerDisplayProps) {
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = mode === 'countdown'
    ? circumference * (1 - progress)
    : 0

  // Color based on countdown progress
  const getColor = () => {
    if (isComplete) return 'var(--timer-danger)'
    if (isPaused) return 'var(--muted-foreground)'
    if (mode === 'stopwatch') return 'var(--timer-running)'
    if (progress > 0.85) return 'var(--timer-danger)'
    if (progress > 0.65) return 'var(--timer-warning)'
    return 'var(--timer-running)'
  }

  return (
    <div className={cn(
      'relative flex items-center justify-center',
      isRunning && 'animate-pulse-glow'
    )}>
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        className="transform -rotate-90"
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
          className="transition-[stroke-dashoffset] duration-200 ease-linear"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-mono text-6xl font-bold tracking-tight transition-colors',
            isComplete && 'text-timer-danger',
            isPaused && 'text-muted-foreground',
          )}
          style={{ color: !isComplete && !isPaused ? getColor() : undefined }}
        >
          {formatTime(displaySeconds)}
        </span>
        <span className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">
          {isComplete ? 'Complete!' : isPaused ? 'Paused' : isRunning ? (mode === 'countdown' ? 'Focusing' : 'Studying') : 'Ready'}
        </span>
      </div>
    </div>
  )
}
