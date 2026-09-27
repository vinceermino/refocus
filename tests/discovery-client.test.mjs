import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { loadSource } from './load-source.mjs'

const room = (id, name = id) => ({ id, name, description: '', tags: ['quiet'], _count: { members: 1 } })
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

// Drive effect lifecycles and deferred responses without adding a browser test dependency.
function harness(query = '') {
  let url = new URL(`https://example.test/discover${query}`)
  const state = []
  const effects = []
  const timers = new Map()
  const requests = []
  const joins = []
  const history = []
  const documentEvents = new EventTarget()
  const windowEvents = new EventTarget()
  const document = { visibilityState: 'visible', addEventListener: documentEvents.addEventListener.bind(documentEvents), removeEventListener: documentEvents.removeEventListener.bind(documentEvents) }
  const navigator = { onLine: true }
  let stateIndex = 0
  let effectIndex = 0
  let timerId = 0
  let tree
  const useState = initial => {
    const index = stateIndex++
    if (!(index in state)) state[index] = initial
    return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next }]
  }
  const updateUrl = (method, next) => { history.push({ method, url: next }); url = new URL(next, url) }
  const { default: Page } = loadSource('src/app/(app)/discover/page.tsx', {
    react: {
      ...React, useState,
      useEffect: (setup, dependencies) => {
        const index = effectIndex++
        const previous = effects[index]
        if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
          previous?.cleanup()
          effects[index] = { dependencies, cleanup: setup() }
        }
      },
      useTransition: () => {
        const [pending, setPending] = useState(false)
        return [pending, action => {
          setPending(true)
          void Promise.resolve(action()).finally(() => setPending(false))
        }]
      },
    },
    'next/link': { default: 'a' },
    'next/navigation': { useSearchParams: () => url.searchParams, usePathname: () => url.pathname, useRouter: () => ({ push: next => updateUrl('route', next) }) },
    '@/components/ui/button': { Button: 'button' },
    '@/components/ui/input': { Input: 'input' },
    '@/components/providers/user-data-provider': { useUserData: () => ({ refreshRooms: async () => {} }) },
    '@/components/layout/minimal-mode-text': { MinimalModeText: 'span' },
    '@/actions/rooms': { joinPublicRoom: id => new Promise(resolve => joins.push({ id, resolve })) },
    globals: {
      URLSearchParams, AbortController, document, navigator,
      window: {
        addEventListener: windowEvents.addEventListener.bind(windowEvents), removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
        history: { pushState: (_state, _title, next) => updateUrl('push', next), replaceState: (_state, _title, next) => updateUrl('replace', next) },
      },
      setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id },
      clearTimeout: id => timers.delete(id),
      fetch: (url, options) => new Promise(resolve => requests.push({ url, ...options, resolve })),
    },
  })
  const render = () => {
    stateIndex = 0
    effectIndex = 0
    const content = elements(Page()).find(element => element.type === React.Suspense).props.children
    tree = content.type()
    return tree
  }
  render()
  return {
    requests, joins, history, render,
    find: predicate => elements(tree).find(predicate),
    all: predicate => elements(tree).filter(predicate),
    url: () => url,
    async tick(delay) {
      const scheduled = [...timers].find(([, timer]) => timer.delay === delay)
      assert.ok(scheduled, `Expected a ${delay}ms timer`)
      timers.delete(scheduled[0])
      scheduled[1].callback()
      await flush()
      render()
    },
    async respond(index, body, status = 200) {
      requests[index].resolve({ status, ok: status < 400, json: typeof body === 'function' ? body : async () => body })
      await flush()
      render()
    },
    visibility(value) { document.visibilityState = value; documentEvents.dispatchEvent(new Event('visibilitychange')); render() },
    online(value) { navigator.onLine = value; windowEvents.dispatchEvent(new Event(value ? 'online' : 'offline')); render() },
    navigate(next) { url = new URL(next, url); render() },
    scheduled: () => timers.size,
    cleanup: () => effects.forEach(effect => effect.cleanup()),
  }
}

test('discovery reads shared URLs, resets pages on search and supports history navigation', async () => {
  const h = harness('?q=math&page=2&view=compact')
  assert.equal(h.find(node => node.type === 'input').props.value, 'math')
  await h.tick(200)
  assert.equal(h.requests[0].url, '/api/discover?q=math&page=2')
  await h.respond(0, { rooms: [room('math')], hasMore: true })
  h.find(node => node.type === 'button' && node.props.children === 'Next').props.onClick()
  assert.equal(h.url().searchParams.get('page'), '3')
  assert.equal(h.history.at(-1).method, 'push')
  h.render()
  assert.equal(h.all(node => node.type === 'article').length, 0, 'Previous page is hidden while loading')
  h.find(node => node.type === 'input').props.onChange({ target: { value: 'art & music' } })
  h.render()
  assert.equal(h.history.at(-1).method, 'replace')
  assert.equal(h.url().searchParams.get('q'), 'art & music')
  assert.equal(h.url().searchParams.has('page'), false)
  assert.equal(h.url().searchParams.get('view'), 'compact')
  h.navigate('/discover?q=math&page=2')
  assert.equal(h.find(node => node.type === 'input').props.value, 'math')
  h.navigate('/discover?page=-3')
  await h.tick(200)
  assert.equal(h.requests.at(-1).url, '/api/discover?q=&page=0')
  h.cleanup()
})

test('discovery retains rooms on a transient error and retries without losing the active query', async () => {
  const h = harness('?q=quiet')
  await h.tick(200)
  await h.respond(0, { rooms: [room('a')], hasMore: false })
  await h.tick(2000)
  await h.respond(1, null, 500)
  assert.equal(h.all(node => node.type === 'article').length, 1)
  assert.match(h.find(node => node.props?.role === 'alert').props.children, /Check your connection/)
  h.find(node => node.type === 'button' && node.props.children === 'Retry').props.onClick()
  h.render()
  assert.ok(h.find(node => node.props?.children === 'Retrying…').props.disabled)
  await h.tick(200)
  assert.equal(h.requests[2].url, '/api/discover?q=quiet&page=0')
  await h.respond(2, { rooms: [room('b')], hasMore: false })
  assert.equal(h.find(node => node.props?.role === 'alert'), undefined)
  assert.equal(h.find(node => node.type === 'h2').props.children, 'b')
  h.cleanup()
})

test('discovery pauses hidden/offline polling, refreshes on return and never overlaps requests', async () => {
  const h = harness()
  await h.tick(200)
  h.visibility('hidden')
  assert.equal(h.requests[0].signal.aborted, true)
  assert.equal(h.scheduled(), 0)
  h.visibility('visible')
  h.online(true)
  assert.equal(h.requests.length, 2)
  await h.respond(0, { rooms: [room('stale')], hasMore: false })
  assert.equal(h.all(node => node.type === 'article').length, 0)
  await h.respond(1, { rooms: [room('current')], hasMore: false })
  assert.equal(h.scheduled(), 1)
  h.online(false)
  assert.equal(h.scheduled(), 0)
  assert.equal(h.find(node => node.type === 'h2').props.children, 'current')
  h.online(true)
  assert.equal(h.requests.length, 3)
  await h.respond(2, { rooms: [room('fresh')], hasMore: false })
  await h.tick(2000)
  assert.equal(h.requests.length, 4, 'Active polling keeps the two-second cadence')
  h.cleanup()
  assert.equal(h.requests[3].signal.aborted, true)
})

test('a response finishing JSON parsing after the search changes cannot replace new results', async () => {
  const h = harness('?q=first')
  let finishJson
  await h.tick(200)
  await h.respond(0, () => new Promise(resolve => { finishJson = resolve }))
  h.navigate('/discover?q=second')
  await h.tick(200)
  await h.respond(1, { rooms: [room('second')], hasMore: false })
  finishJson({ rooms: [room('first')], hasMore: true })
  await flush()
  h.render()
  assert.equal(h.find(node => node.type === 'h2').props.children, 'second')
  assert.equal(h.requests[0].signal.aborted, true)
  h.cleanup()
})

test('authorization failures clear directory data and stop automatic polling', async () => {
  for (const status of [401, 403]) {
    const h = harness()
    await h.tick(200)
    await h.respond(0, { rooms: [room('private-data')], hasMore: true })
    await h.tick(2000)
    await h.respond(1, null, status)
    assert.equal(h.all(node => node.type === 'article').length, 0)
    assert.equal(h.find(node => node.type === 'a').props.href, '/login')
    assert.equal(h.scheduled(), 0)
    h.visibility('hidden')
    h.visibility('visible')
    assert.equal(h.requests.length, 2)
    h.cleanup()
  }
})

test('only the chosen room shows joining feedback and polling cannot erase a join error', async () => {
  const h = harness()
  await h.tick(200)
  const body = { rooms: [room('a'), room('b')], hasMore: false }
  await h.respond(0, body)
  h.find(node => node.props?.['aria-label'] === 'Join a').props.onClick()
  h.render()
  assert.equal(h.find(node => node.props?.['aria-label'] === 'Join a').props.children, 'Joining…')
  assert.equal(h.find(node => node.props?.['aria-label'] === 'Join b').props.children, 'Join')
  h.joins[0].resolve({ error: 'You are banned from this room.' })
  await flush()
  h.render()
  await h.tick(2000)
  await h.respond(1, body)
  assert.equal(h.find(node => node.props?.role === 'alert').props.children, 'You are banned from this room.')
  assert.equal(h.all(node => node.type === 'article').length, 2)
  h.cleanup()
})
