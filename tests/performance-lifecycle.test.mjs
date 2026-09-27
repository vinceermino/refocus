import { test } from 'node:test'
import assert from 'node:assert/strict'
import { browserEvents, createHookHarness, deferred, flushPromises, loadSource } from './helpers/react-hooks.mjs'

test('multiple clocks share one ticker, stop while hidden, catch up on return and clean up', () => {
  const browser = browserEvents()
  let created = 0, cleared = 0, now = 1000, calls = 0
  const setInterval = browser.window.setInterval
  const clearInterval = browser.window.clearInterval
  browser.window.setInterval = cb => { created++; return setInterval(cb) }
  browser.window.clearInterval = id => { if (id !== undefined) cleared++; clearInterval(id) }
  Object.assign(browser.document, { addEventListener: browser.window.addEventListener, removeEventListener: browser.window.removeEventListener })
  const { subscribeClock, useClock } = loadSource('src/hooks/use-clock.ts', { react: { useCallback: value => value, useSyncExternalStore: (_, snapshot) => snapshot() } }, { ...browser, Date: { now: () => now } })
  const first = subscribeClock(() => calls++)
  const second = subscribeClock(() => calls++)
  assert.equal(created, 1)
  now = 2345
  browser.tickIntervals()
  assert.equal(useClock(true), 2345, 'Keep milliseconds so a startedAt timestamp is not rounded late')
  browser.document.visibilityState = 'hidden'
  browser.dispatch('visibilitychange')
  const hiddenCalls = calls
  browser.tickIntervals()
  assert.equal(calls, hiddenCalls)
  now = 55000
  browser.document.visibilityState = 'visible'
  browser.dispatch('visibilitychange')
  assert.equal(useClock(true), 55000)
  first(); second()
  assert.equal(created, cleared)
})

test('room polling never overlaps, aborts on hide, ignores superseded reads and preserves equal snapshots', async () => {
  const harness = createHookHarness(), browser = browserEvents(), requests = []
  Object.assign(browser.document, { addEventListener: browser.window.addEventListener, removeEventListener: browser.window.removeEventListener })
  const router = { replace() {} }
  const { useRealtimeTimer } = loadSource('src/hooks/use-realtime-timer.ts', {
    react: harness.react, 'next/navigation': { useRouter: () => router }, '@/actions/rooms': { heartbeatRoom: async () => {} },
  }, { ...browser, ...browser.window, navigator: { onLine: true }, fetch: (url, { signal }) => { const request = deferred(); requests.push({ ...request, signal }); return request.promise } })
  const render = () => harness.render(() => useRealtimeTimer('room'))
  render(); browser.flushTimeouts()
  assert.equal(requests.length, 1)
  browser.document.visibilityState = 'hidden'; browser.dispatch('visibilitychange')
  assert.equal(requests[0].signal.aborted, true)
  browser.document.visibilityState = 'visible'; browser.dispatch('visibilitychange')
  assert.equal(requests.length, 2)
  const data = { members: [], room: { id: 'room', name: 'test' }, role: 'owner', timer: { id: 'a', mode: 'countdown', status: 'running', duration: 300, startedAt: '2026-09-27T00:00:00Z', elapsed: 0 } }
  requests[1].resolve({ ok: true, status: 200, json: async () => data }); await flushPromises()
  const current = render()
  requests[0].resolve({ ok: true, status: 200, json: async () => ({ ...data, timer: null }) }); await flushPromises()
  assert.equal(render().timerState, current.timerState)
  browser.flushTimeouts()
  requests[2].resolve({ ok: true, status: 200, json: async () => structuredClone(data) }); await flushPromises()
  assert.equal(render().snapshot, current.snapshot)
  assert.equal(render().timerState, current.timerState)
  browser.flushTimeouts()
  render().broadcastTimerUpdate('paused', { ...data.timer, status: 'paused' })
  requests[3].resolve({ ok: true, status: 200, json: async () => data }); await flushPromises()
  assert.equal(render().timerState.status, 'paused')
  browser.flushTimeouts(); harness.unmount()
  assert.equal(requests[4].signal.aborted, true)
})
