'use client'

import { useSyncExternalStore } from 'react'

function subscribe(notify: () => void) {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return (
    <div role="status">
      {!online && <p className="border-b border-timer-warning/30 bg-card px-4 py-3 text-center text-sm text-timer-warning">You are offline. Shared timers and saving study sessions need a connection.</p>}
    </div>
  )
}
