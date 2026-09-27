// Each mounted timer owns its registration, so navigation or another timer's
// cleanup cannot clear a session that is still running.
const runningTimers = new Set<symbol>()

export function syncTimerAppearance() {
  const variant = document.body.dataset.variant === 'she' ? 'she' : 'he'
  const active = runningTimers.size > 0

  document.documentElement.classList.toggle('timer-running-he', variant === 'he' && active)

  const favicon = document.getElementById('favicon') as HTMLLinkElement | null
  if (favicon) favicon.href = `/favicon-${variant}${active ? '-active' : ''}.svg`
}

export function registerRunningTimer() {
  const timer = Symbol('running-timer')
  runningTimers.add(timer)
  syncTimerAppearance()

  return () => {
    runningTimers.delete(timer)
    syncTimerAppearance()
  }
}
