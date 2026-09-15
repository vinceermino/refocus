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
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const calculate = useCallback(() => {
    const s = stateRef.current
    if (s.status === 'stopped') {
      return s.mode === 'countdown' ? s.duration : 0
    }

    if (s.status === 'paused') {
      if (s.mode === 'countdown') {
        return Math.max(0, s.duration - s.elapsed)
      }
      return s.elapsed
    }

    // Running
    if (!s.startedAt) {
      return s.mode === 'countdown' ? s.duration : 0
    }

    const now = Date.now()
    const started = new Date(s.startedAt).getTime()
    const currentRunElapsed = Math.floor((now - started) / 1000)
    const totalElapsed = s.elapsed + currentRunElapsed

    if (s.mode === 'countdown') {
      return Math.max(0, s.duration - totalElapsed)
    }

    // Stopwatch: cap at daily remaining if provided, otherwise cap at 8h
    const cap = dailyRemaining ?? MAX_DAILY_SECONDS
    return Math.min(totalElapsed, cap)
  }, [dailyRemaining])

  useEffect(() => {
    // Immediately calculate on any state change
    setDisplaySeconds(calculate())

    if (state.status !== 'running') {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Use 1-second interval instead of requestAnimationFrame (60fps)
    // since the display only shows whole seconds
    intervalRef.current = setInterval(() => {
      setDisplaySeconds(calculate())
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.status, state.startedAt, state.elapsed, state.duration, state.mode, calculate])

  // Handle tab visibility — recalculate on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && stateRef.current.status === 'running') {
        setDisplaySeconds(calculate())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [calculate])

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
