'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatTime } from '@/lib/utils'

interface TimerState {
  mode: 'countdown' | 'stopwatch'
  status: 'running' | 'paused' | 'stopped'
  duration: number // total duration in seconds (for countdown; 0 for stopwatch)
  startedAt: string | null // ISO timestamp when current run started
  elapsed: number // accumulated elapsed seconds from previous runs (pause/resume)
}

interface TimerOutput {
  displaySeconds: number // For countdown: remaining. For stopwatch: total elapsed.
  progress: number // 0 to 1 (for countdown: how much time passed; for stopwatch: always 0)
  isComplete: boolean
  isRunning: boolean
  isPaused: boolean
}

const MAX_DAILY_SECONDS = 8 * 60 * 60 // 8 hours

export function useLocalTimer(state: TimerState, dailyRemaining?: number): TimerOutput {
  const [, setTick] = useState(0)

  let displaySeconds = 0
  if (state.status === 'stopped') {
    displaySeconds = state.mode === 'countdown' ? state.duration : 0
  } else if (state.status === 'paused') {
    if (state.mode === 'countdown') {
      displaySeconds = Math.max(0, state.duration - state.elapsed)
    } else {
      displaySeconds = state.elapsed
    }
  } else {
    // Running
    if (!state.startedAt) {
      displaySeconds = state.mode === 'countdown' ? state.duration : 0
    } else {
      const now = Date.now()
      const started = new Date(state.startedAt).getTime()
      const currentRunElapsed = Math.floor((now - started) / 1000)
      const totalElapsed = state.elapsed + currentRunElapsed

      if (state.mode === 'countdown') {
        displaySeconds = Math.max(0, state.duration - totalElapsed)
      } else {
        const cap = dailyRemaining ?? MAX_DAILY_SECONDS
        displaySeconds = Math.min(totalElapsed, cap)
      }
    }
  }

  useEffect(() => {
    if (state.status !== 'running') {
      return
    }

    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [state.status])

  // Handle tab visibility — recalculate on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && state.status === 'running') {
        setTick(t => t + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state.status])

  // Update document title with timer value
  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      const modeIndicator = state.mode === 'countdown' ? '⏳' : '⏱️'
      const statusIndicator = state.status === 'paused' ? '⏸️ ' : ''
      document.title = `${statusIndicator}${formatTime(displaySeconds)} ${modeIndicator} Re-Focus`
    } else {
      document.title = 'Re-Focus — Shared Study Timer'
    }
  }, [displaySeconds, state.status, state.mode])

  const isComplete = state.mode === 'countdown' && displaySeconds <= 0 && state.status === 'running'

  // For stopwatch, check if daily limit reached
  const dailyLimitReached = state.mode === 'stopwatch' &&
    state.status === 'running' &&
    dailyRemaining !== undefined &&
    displaySeconds >= dailyRemaining

  const progress = state.mode === 'countdown' && state.duration > 0
    ? 1 - (displaySeconds / state.duration)
    : 0

  return {
    displaySeconds,
    progress,
    isComplete: isComplete || dailyLimitReached,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
  }
}
