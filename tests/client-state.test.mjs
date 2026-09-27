import { test } from 'node:test'
import assert from 'node:assert/strict'
import { browserEvents, createHookHarness, deferred, flushPromises, loadSource } from './helpers/react-hooks.mjs'

const snapshot = (name = 'first', goalMinutes = 120) => ({
  profile: { id: `profile-${name}`, username: name, genderPref: 'any', totalStudyTime: 0 },
  rooms: [{ id: `room-${name}`, name, code: name, _count: { members: 1 }, timers: [] }],
  stats: { goalMinutes },
})

function userData(initialData = snapshot(), initialUserId = 'auth-first') {
  const harness = createHookHarness()
  const browser = browserEvents()
  const requests = []
  let authCallback
  const { UserDataProvider } = loadSource('src/components/providers/user-data-provider.tsx', {
    './user-data-context': loadSource('src/components/providers/user-data-context.ts', {}),
    react: harness.react,
    '@/lib/supabase/client': { createClient: () => ({ auth: { onAuthStateChange: callback => {
      authCallback = callback
      return { data: { subscription: { unsubscribe() { authCallback = undefined } } } }
    } } }) },
  }, {
    ...browser,
    fetch(url, init) {
      const request = deferred()
      requests.push({ ...request, url, signal: init.signal })
      return request.promise
    },
  })
  const render = () => harness.render(() => UserDataProvider({ children: null, initialData })).props.value
  render()
  const auth = (event, id = 'auth-first') => authCallback(event, id ? { user: { id } } : null)
  auth('INITIAL_SESSION', initialUserId)
  const respond = (index, data, status = 200) => requests[index].resolve({ ok: status < 400, status, json: async () => data })
  return { harness, browser, requests, render, auth, respond }
}

test('user-data refreshes replace older requests and keep loading until the latest response', async () => {
  const app = userData()
  const older = app.render().refreshAll()
  const newer = app.render().refreshStats()
  assert.equal(app.requests[0].signal.aborted, true)
  app.respond(0, snapshot('older'))
  await older
  assert.equal(app.render().isRefreshingStats, true)
  assert.equal(app.render().profile.username, 'first')
  app.respond(1, snapshot('newer'))
  await newer
  assert.equal(app.render().profile.username, 'newer')
  assert.equal(app.render().rooms[0].name, 'newer')
  assert.equal(app.render().isRefreshingStats, false)
})

test('sign-out invalidates pending responses and late goal-save callbacks', async () => {
  const app = userData()
  const previous = app.render()
  const request = previous.refreshStats()
  app.auth('SIGNED_OUT', null)
  assert.equal(app.requests[0].signal.aborted, true)
  previous.applyStats({ goalMinutes: 300 })
  app.respond(0, snapshot('signed-out'))
  await request
  app.browser.flushTimeouts()
  const current = app.render()
  assert.equal(current.profile, null)
  assert.equal(current.stats, null)
  assert.equal(current.rooms.length, 0)
  assert.equal(current.error, null)
  assert.equal(current.isLoading, false)
  assert.equal(app.requests.length, 1)
})

test('authorization failure clears previously loaded private data and allows retry', async () => {
  const app = userData()
  const request = app.render().refreshAll()
  app.respond(0, null, 401)
  await request
  assert.equal(app.render().profile, null)
  assert.equal(app.render().stats, null)
  assert.match(app.render().error, /Sign in/)
  const retry = app.render().refreshAll()
  app.respond(1, snapshot('restored'))
  await retry
  assert.equal(app.render().profile.username, 'restored')
  assert.equal(app.render().error, null)
})

test('an initially missing session exposes sign-in recovery without fetching protected data', () => {
  const app = userData(null, null)
  app.browser.flushTimeouts()
  assert.equal(app.render().profile, null)
  assert.equal(app.render().isLoading, false)
  assert.match(app.render().error, /Sign in/)
  assert.equal(app.requests.length, 0)
})

test('a missing profile clears previous data with a recovery message', async () => {
  const app = userData()
  const request = app.render().refreshAll()
  app.respond(0, null, 404)
  await request
  assert.equal(app.render().profile, null)
  assert.equal(app.render().stats, null)
  assert.match(app.render().error, /profile could not be found/)
})

test('a completed goal save wins over an earlier read while room data still refreshes', async () => {
  const app = userData()
  const request = app.render().refreshStats()
  app.render().applyStats({ goalMinutes: 240 })
  app.respond(0, { ...snapshot(), rooms: snapshot('updated').rooms })
  await request
  assert.equal(app.render().stats.goalMinutes, 240)
  assert.equal(app.render().rooms[0].name, 'updated')
})

test('focus, poll and repeated sign-in events share one pending background request', async () => {
  const app = userData()
  app.browser.dispatch('focus')
  app.browser.tickIntervals()
  app.auth('SIGNED_IN')
  assert.equal(app.requests.length, 1)
  app.respond(0, snapshot())
  await flushPromises()
  assert.equal(app.render().isRefreshingStats, false)
})

test('account switches clear old data and prevent a prior account callback from writing', async () => {
  const app = userData()
  const previous = app.render()
  app.auth('SIGNED_IN', 'auth-second')
  assert.equal(app.render().profile, null)
  app.respond(0, snapshot('second'))
  await flushPromises()
  previous.applyStats({ goalMinutes: 300 })
  assert.equal(app.render().profile.username, 'second')
  assert.equal(app.render().stats.goalMinutes, 120)
})

test('provider cleanup aborts its pending request without reporting cancellation as an error', async () => {
  const app = userData()
  const request = app.render().refreshStats()
  app.harness.unmount()
  assert.equal(app.requests[0].signal.aborted, true)
  app.requests[0].reject(new Error('Aborted'))
  await request
  assert.equal(app.render().error, null)
})

function apiResource() {
  const harness = createHookHarness()
  const browser = browserEvents()
  const requests = []
  const { useApiResource } = loadSource('src/hooks/use-api-resource.ts', {
    react: harness.react,
    '@/lib/client-api': { requestJson(url, init) {
      const request = deferred()
      requests.push({ ...request, url, signal: init.signal })
      return request.promise
    } },
  }, browser)
  return { harness, browser, requests, render: (url, effects = true) => harness.render(() => useApiResource(url), effects) }
}

test('resource data belongs to its URL, including the render before navigation effects', async () => {
  const app = apiResource()
  app.render('/first')
  app.browser.flushTimeouts()
  app.requests[0].resolve({ owner: 'first' })
  await flushPromises()
  const previous = app.render('/first')
  assert.equal(previous.data.owner, 'first')
  const navigated = app.render('/second', false)
  assert.equal(navigated.data, null)
  assert.equal(navigated.error, null)
  assert.equal(navigated.isLoading, true)
  app.harness.flushEffects()
  app.browser.flushTimeouts()
  await previous.refresh()
  assert.equal(app.requests.length, 2, 'An old mutation callback must not cancel the new route load')
  assert.equal(app.requests[1].signal.aborted, false)
  app.requests[1].resolve({ owner: 'second' })
  await flushPromises()
  assert.equal(app.render('/second').data.owner, 'second')
})

test('superseded resource errors cannot erase a newer response', async () => {
  const app = apiResource()
  app.render('/profile')
  app.browser.flushTimeouts()
  const current = app.render('/profile').refresh()
  app.requests[1].resolve({ owner: 'current' })
  await current
  app.requests[0].reject(new Error('Aborted'))
  await flushPromises()
  assert.equal(app.render('/profile').data.owner, 'current')
  assert.equal(app.render('/profile').error, null)
})

test('resource failures clear content and expose a retryable error', async () => {
  const app = apiResource()
  app.render('/profile')
  app.browser.flushTimeouts()
  app.requests[0].resolve({ private: true })
  await flushPromises()
  const request = app.render('/profile').refresh()
  app.requests[1].reject(new Error('Permission denied'))
  await request
  const current = app.render('/profile')
  assert.equal(current.data, null)
  assert.equal(current.isLoading, false)
  assert.equal(current.error, 'Permission denied')
})
