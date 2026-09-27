'use client'

import { useCallback, useSyncExternalStore } from 'react'

let now = 0
const listeners = new Set<() => void>()
let interval: number | undefined

function tick() {
  now = Date.now()
  listeners.forEach(notify => notify())
}

function resume() {
  if (interval !== undefined) window.clearInterval(interval)
  interval = undefined
  tick()
  if (document.visibilityState === 'visible' && listeners.size) interval = window.setInterval(tick, 1000)
}

export function subscribeClock(notify: () => void) {
  listeners.add(notify)
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', resume)
    resume()
  }
  return () => {
    listeners.delete(notify)
    if (!listeners.size) {
      window.clearInterval(interval)
      interval = undefined
      document.removeEventListener('visibilitychange', resume)
    }
  }
}

export function useClock(active: boolean, resolution = 1000) {
  const subscribe = useCallback((notify: () => void) => {
    if (!active) return () => {}
    return subscribeClock(notify)
  }, [active])
  const snapshot = useCallback(() => resolution === 1000 ? now : Math.floor(now / resolution) * resolution, [resolution])
  return useSyncExternalStore(subscribe, snapshot, () => 0)
}
