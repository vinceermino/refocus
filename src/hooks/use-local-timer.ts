'use client'

import { useEffect } from 'react'
import { useClock } from '@/hooks/use-clock'
import { formatTime } from '@/lib/utils'

export interface TimerState {
  id: string | null
  mode: 'countdown' | 'stopwatch' | 'rest'
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
  const now = useClock(state.status === 'running')

  let displaySeconds = 0
  if (state.status === 'stopped') {
    displaySeconds = state.mode === 'countdown' || state.mode === 'rest' ? state.duration : 0
  } else if (state.status === 'paused') {
    if (state.mode === 'countdown' || state.mode === 'rest') {
      displaySeconds = Math.max(0, state.duration - state.elapsed)
      // Stop countdown/rest at 0
      if (displaySeconds < 0 && (state.mode === 'countdown' || state.mode === 'rest')) {
        displaySeconds = 0
      }
    } else {
      displaySeconds = state.elapsed
    }
  } else {
    // Running
    if (!state.startedAt) {
      displaySeconds = state.mode === 'countdown' || state.mode === 'rest' ? state.duration : 0
    } else {
      const started = new Date(state.startedAt).getTime()
      const currentRunElapsed = Math.max(0, Math.floor(((now || started) - started) / 1000))
      const totalElapsed = state.elapsed + currentRunElapsed

      if (state.mode === 'countdown' || state.mode === 'rest') {
        displaySeconds = Math.max(0, state.duration - totalElapsed)
      } else {
        const cap = dailyRemaining ?? MAX_DAILY_SECONDS
        displaySeconds = Math.min(totalElapsed, cap)
      }
    }
  }

  // Update document title with timer value
  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      const formattedTime = formatTime(displaySeconds)
      const modeIndicator = state.mode === 'countdown' ? '🎯' : state.mode === 'rest' ? '☕' : '⏱️'
      document.title = `${state.status === 'paused' ? '⏸️ ' : ''}${modeIndicator} ${formattedTime} - ${state.status}`
    } else {
      document.title = 'Re-Focus — Shared Study Timer'
    }
  }, [displaySeconds, state.status, state.mode])

  // For stopwatch, check if daily limit reached
  const dailyLimitReached = state.mode === 'stopwatch' &&
    state.status === 'running' &&
    dailyRemaining !== undefined &&
    displaySeconds >= dailyRemaining

  // For countdown and rest modes, complete when reaching 0. For stopwatch, complete when reaching daily limit.
  const isComplete = (state.mode === 'countdown' || state.mode === 'rest')
    ? state.status !== 'stopped' && displaySeconds === 0
    : state.status !== 'stopped' && dailyLimitReached

  // Progress logic
  let progress = 0
  if (state.mode === 'countdown' || state.mode === 'rest') {
    progress = state.duration > 0 ? (state.duration - displaySeconds) / state.duration : 0
  } else {
    progress = 0
  }

  return {
    displaySeconds,
    progress,
    isComplete: isComplete || dailyLimitReached,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
  }
}
