'use client'

import { useCallback, useSyncExternalStore } from 'react'

let now = 0

export function useClock(active: boolean) {
  const subscribe = useCallback((notify: () => void) => {
    if (!active) return () => {}
    const tick = () => { now = Date.now(); notify() }
    tick()
    const interval = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])
  return useSyncExternalStore(subscribe, () => now, () => 0)
}
