'use client'

import { useCallback, useSyncExternalStore } from 'react'

const fallback = new Map<string, string>()
const changeEvent = 'refocus-storage-change'

// Keep preferences usable in memory when browser storage is unavailable.
export function useStoredValue(key: string) {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) notify()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(changeEvent, notify)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(changeEvent, notify)
    }
  }, [key])

  const getSnapshot = useCallback(() => {
    if (fallback.has(key)) return fallback.get(key)!
    try { return localStorage.getItem(key) } catch { return null }
  }, [key])

  const value = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const setValue = useCallback((next: string) => {
    try {
      localStorage.setItem(key, next)
      fallback.delete(key)
    } catch {
      fallback.set(key, next)
    }
    window.dispatchEvent(new Event(changeEvent))
  }, [key])

  return [value, setValue] as const
}
