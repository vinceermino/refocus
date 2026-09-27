'use client'

import { useEffect } from 'react'
import { useAccent } from '@/components/providers/accent-provider'

// Each mounted timer owns its registration, so a route transition or a second
// timer cannot clear another running timer's presentation state.
const runningTimers = new Set<symbol>()

export function useTimerAppearance(isRunning: boolean, isPaused: boolean, isComplete: boolean) {
  const { accent } = useAccent()
  const active = accent === 'dark' && isRunning && !isPaused && !isComplete

  useEffect(() => {
    if (!active) return

    const timer = Symbol('running-he-timer')
    const root = document.documentElement
    runningTimers.add(timer)
    root.classList.add('timer-running-he')

    return () => {
      runningTimers.delete(timer)
      root.classList.toggle('timer-running-he', runningTimers.size > 0)
    }
  }, [active])
}
