import { test } from 'node:test'
import assert from 'node:assert/strict'
import { browserEvents, createHookHarness, deferred, flushPromises, loadSource } from './helpers/react-hooks.mjs'

function fullscreen({ prefix = false, reject = false, keepOnPause = true, delayed = false } = {}) {
  const harness = createHookHarness(), browser = browserEvents()
  let stored = 'true', enters = 0, exits = 0
  const pending = deferred()
  const field = prefix ? 'webkitFullscreenElement' : 'fullscreenElement'
  const enterName = prefix ? 'webkitRequestFullscreen' : 'requestFullscreen'
  const exitName = prefix ? 'webkitExitFullscreen' : 'exitFullscreen'
  const event = prefix ? 'webkitfullscreenchange' : 'fullscreenchange'
  const doc = { ...browser.document, documentElement: { [enterName]() {} }, [field]: null, addEventListener: browser.window.addEventListener, removeEventListener: browser.window.removeEventListener }
  const panel = { [enterName]() { enters++; if (reject) return Promise.reject(new Error('Denied')); if (delayed) return pending.promise.then(() => { doc[field] = panel; browser.dispatch(event) }); doc[field] = panel; browser.dispatch(event); return Promise.resolve() } }
  doc[exitName] = () => { exits++; doc[field] = null; browser.dispatch(event); return Promise.resolve() }
  const { useTimerFullscreen } = loadSource('src/hooks/use-timer-fullscreen.ts', {
    react: { ...harness.react, useSyncExternalStore: (_, snapshot) => snapshot() },
    '@/hooks/use-stored-value': { useStoredValue: () => [stored, value => { stored = value }] },
  }, { document: doc })
  const render = (status = 'stopped', complete = false) => {
    const result = harness.render(() => useTimerFullscreen(status, complete, { keepOnPause }), false)
    result.ref.current = panel
    harness.flushEffects()
    return result
  }
  return { render, harness, browser, pending, panel, doc, field, event, entered: () => enters, exited: () => exits, stored: () => stored }
}

for (const prefix of [false, true]) test(`fullscreen ${prefix ? 'vendor' : 'standard'} follows Start, pause, Escape, completion, stop and preference`, async () => {
  const app = fullscreen({ prefix })
  app.render().requestOnStart()
  assert.equal(app.entered(), 1, 'Fullscreen is requested synchronously in the Start gesture')
  assert.equal(app.render('running').fullscreen, true)
  app.render('paused'); assert.equal(app.exited(), 0)
  app.doc[app.field] = null; app.browser.dispatch(app.event)
  assert.equal(app.render('paused').fullscreen, false)
  app.render().requestOnStart(); app.render('running', true)
  assert.equal(app.exited(), 1)
  app.render().requestOnStart(); app.render('running'); app.render('stopped')
  assert.equal(app.exited(), 2)
  app.render().setEnabled(false); assert.equal(app.stored(), 'false')
  app.render().requestOnStart(); assert.equal(app.entered(), 3)
  app.harness.unmount(); await flushPromises()
})

test('fullscreen rejection is announced and configurable pause/unmount exits', async () => {
  const denied = fullscreen({ reject: true })
  denied.render().requestOnStart(); await flushPromises()
  assert.match(denied.render('running').announcement, /could not open/)
  denied.harness.unmount()
  const paused = fullscreen({ keepOnPause: false })
  paused.render().requestOnStart(); paused.render('running'); paused.render('paused')
  assert.equal(paused.exited(), 1)
  paused.render().requestOnStart(); paused.render('running'); paused.harness.unmount()
  assert.equal(paused.exited(), 2)
})

test('late fullscreen resolution after failed server start or unmount cannot strand the page', async () => {
  for (const cancel of ['cancelStart', 'unmount']) {
    const app = fullscreen({ delayed: true })
    const result = app.render(); result.requestOnStart()
    if (cancel === 'unmount') app.harness.unmount(); else result.cancelStart()
    app.pending.resolve(); await flushPromises()
    assert.equal(app.doc[app.field], null)
  }
})

function updates() {
  const browser = browserEvents(), regEvents = browserEvents(), workerEvents = browserEvents()
  const activity = loadSource('src/lib/timer-activity.ts', {})
  const serviceWorker = { ...browser.window, controller: {} }
  let posted = 0, reloads = 0
  const notices = []
  const worker = { ...workerEvents.window, state: 'installing' }
  const registration = { ...regEvents.window, waiting: null, installing: worker }
  const { watchServiceWorkerUpdates } = loadSource('src/lib/pwa-updates.ts', { '@/lib/timer-activity': activity }, { navigator: { serviceWorker } })
  const cleanup = watchServiceWorkerUpdates(registration, refresh => notices.push(refresh), () => reloads++)
  const ready = () => { registration.waiting = { postMessage: () => posted++ }; worker.state = 'installed'; workerEvents.dispatch('statechange') }
  return { activity, browser, registration, ready, cleanup, notices, posted: () => posted, reloads: () => reloads }
}

test('an update waits for running/paused timers and never auto-reloads on controllerchange', () => {
  const app = updates(), stop = app.activity.registerTimerSession()
  app.ready(); assert.equal(app.notices.at(-1), null)
  app.browser.dispatch('controllerchange'); assert.equal(app.reloads(), 0)
  stop(); const refresh = app.notices.at(-1); assert.equal(typeof refresh, 'function')
  const pause = app.activity.registerTimerSession()
  refresh(); assert.equal(app.posted(), 0, 'An old toast cannot refresh an active timer')
  pause(); app.notices.at(-1)(); assert.equal(app.posted(), 1)
  app.browser.dispatch('controllerchange'); assert.equal(app.reloads(), 1)
  app.cleanup()
})

test('a timer started while an accepted update activates still prevents reload', () => {
  const app = updates(); app.ready(); app.notices.at(-1)()
  const stop = app.activity.registerTimerSession()
  app.browser.dispatch('controllerchange'); assert.equal(app.reloads(), 0)
  stop(); assert.equal(app.reloads(), 0)
  app.notices.at(-1)(); assert.equal(app.reloads(), 1)
  app.cleanup()
})
