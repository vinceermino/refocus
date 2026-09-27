'use client'

import { useEffect } from 'react'
import { registerRunningTimer } from '@/lib/timer-appearance'

export function useTimerAppearance(isRunning: boolean, isPaused: boolean, isComplete: boolean) {
  const active = isRunning && !isPaused && !isComplete

  useEffect(() => {
    if (!active) return

    return registerRunningTimer()
  }, [active])
}
