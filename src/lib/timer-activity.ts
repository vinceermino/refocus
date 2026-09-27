// Includes paused sessions: a service-worker refresh must not discard either.
const sessions = new Set<symbol>()
const listeners = new Set<() => void>()
export const hasActiveTimer = () => sessions.size > 0
export function subscribeTimerActivity(notify: () => void) {
  listeners.add(notify)
  return () => { listeners.delete(notify) }
}
export function registerTimerSession() {
  const id = Symbol('timer-session')
  sessions.add(id)
  listeners.forEach(notify => notify())
  return () => { sessions.delete(id); listeners.forEach(notify => notify()) }
}
