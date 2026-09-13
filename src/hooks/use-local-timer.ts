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

export function useLocalTimer(state: TimerState): TimerOutput {
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const rafRef = useRef<number>(0)

  const calculate = useCallback(() => {
    if (state.status === 'stopped') {
      return state.mode === 'countdown' ? state.duration : 0
    }

    if (state.status === 'paused') {
      if (state.mode === 'countdown') {
        return Math.max(0, state.duration - state.elapsed)
      }
      return state.elapsed
    }

    // Running
    if (!state.startedAt) {
      return state.mode === 'countdown' ? state.duration : 0
    }

    const now = Date.now()
    const started = new Date(state.startedAt).getTime()
    const currentRunElapsed = Math.floor((now - started) / 1000)
    const totalElapsed = state.elapsed + currentRunElapsed

    if (state.mode === 'countdown') {
      return Math.max(0, state.duration - totalElapsed)
    }
    return totalElapsed
  }, [state])

  useEffect(() => {
    setDisplaySeconds(calculate())

    if (state.status !== 'running') {
      return
    }

    const tick = () => {
      setDisplaySeconds(calculate())
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [state.status, state.startedAt, state.elapsed, state.duration, state.mode, calculate])

  // Handle tab visibility — recalculate on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && state.status === 'running') {
        setDisplaySeconds(calculate())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state.status, calculate])

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
  const progress = state.mode === 'countdown' && state.duration > 0
    ? 1 - (displaySeconds / state.duration)
    : 0

  return {
    displaySeconds,
    progress,
    isComplete,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
  }
}
