import { hasActiveTimer, subscribeTimerActivity } from '@/lib/timer-activity'

/** No reload on first installation or updates accepted in another tab. */
export function watchServiceWorkerUpdates(
  registration: ServiceWorkerRegistration,
  notify: (refresh: (() => void) | null) => void,
  reload = () => window.location.reload(),
) {
  let reloadRequested = false
  let activated = false
  const reloadWhenIdle = () => { if (!hasActiveTimer()) reload() }
  const workers = new Map<ServiceWorker, () => void>()
  const refresh = () => {
    if (hasActiveTimer() || !registration.waiting) return
    reloadRequested = true
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
  const announce = () => {
    if (registration.waiting && navigator.serviceWorker.controller) notify(hasActiveTimer() ? null : refresh)
  }
  const watchInstalling = () => {
    const worker = registration.installing
    if (!worker || workers.has(worker)) return
    const changed = () => { if (worker.state === 'installed') announce() }
    worker.addEventListener('statechange', changed)
    workers.set(worker, changed)
  }
  const controlled = () => {
    if (!reloadRequested) return
    activated = true
    // A timer can start between accepting an update and activation completing.
    if (hasActiveTimer()) notify(null)
    else reloadWhenIdle()
  }
  registration.addEventListener('updatefound', watchInstalling)
  navigator.serviceWorker.addEventListener('controllerchange', controlled)
  const unsubscribe = subscribeTimerActivity(() => {
    if (reloadRequested) {
      if (activated) notify(hasActiveTimer() ? null : reloadWhenIdle)
    } else announce()
  })
  watchInstalling()
  announce()
  return () => {
    registration.removeEventListener('updatefound', watchInstalling)
    navigator.serviceWorker.removeEventListener('controllerchange', controlled)
    workers.forEach((callback, worker) => worker.removeEventListener('statechange', callback))
    unsubscribe()
  }
}
