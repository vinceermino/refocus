import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHookHarness, loadSource } from './helpers/react-hooks.mjs'

// Exercise the shared display and effect cleanup; the existing timer suite owns
// elapsed-time calculations. No DOM renderer or live account is required.
function appearance(initialAccent = 'dark') {
  let stored = initialAccent
  let currentHarness
  const classes = new Set(['dark', 'existing-class'])
  const favicon = { href: '/favicon-he.svg' }
  const attributes = new Map()
  const document = {
    body: { dataset: { variant: 'he' } },
    documentElement: {
      setAttribute: (name, value) => attributes.set(name, value),
      classList: { toggle: (value, active) => active ? classes.add(value) : classes.delete(value) },
    },
    getElementById: id => id === 'favicon' ? favicon : null,
  }
  const react = Object.fromEntries(['useEffect', 'useCallback', 'useMemo', 'useRef'].map(name => [name, (...args) => currentHarness.react[name](...args)]))
  const presentation = loadSource('src/lib/timer-appearance.ts', {}, { document })
  const providerHarness = createHookHarness()
  const setStored = value => { stored = value }
  const { AccentProvider } = loadSource('src/components/providers/accent-provider.tsx', {
    react: { ...react, createContext: () => ({ Provider: 'provider' }) },
    '@/hooks/use-stored-value': { useStoredValue: () => [stored, setStored] },
    '@/lib/timer-appearance': presentation,
    '@/lib/theme-assets': { loadTheme: () => ({ then(callback) { callback(); return { catch() {} } } }) },
    sonner: { toast: { error() {} } },
  }, { document, window: { dispatchEvent() {} }, Event: class {} })
  const renderProvider = () => {
    currentHarness = providerHarness
    return providerHarness.render(() => AccentProvider({ children: null })).props.value.accent
  }
  renderProvider()
  const hook = loadSource('src/hooks/use-timer-appearance.ts', {
    react,
    '@/lib/timer-appearance': presentation,
  }, { document })
  const { TimerDisplay } = loadSource('src/components/timer/timer-display.tsx', {
    '@/components/timer/progress-ring': { ProgressRing: 'progress-ring' },
    '@/hooks/use-timer-appearance': hook,
    '@/hooks/use-clock': { useClock: () => null },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' '), formatTime: String },
  })
  return {
    classes,
    favicon: () => favicon.href,
    variant: () => document.body.dataset.variant,
    stored: () => stored,
    accent: () => attributes.get('data-accent'),
    setAccent(value) { stored = value; return renderProvider() },
    active: () => classes.has('timer-running-he'),
    timer() {
      const harness = createHookHarness()
      return {
        render(state = {}) {
          currentHarness = harness
          return harness.render(() => TimerDisplay({
            displaySeconds: 1500, progress: 0, mode: 'countdown',
            isRunning: false, isPaused: false, isComplete: false, ...state,
          }))
        },
        unmount: () => harness.unmount(),
      }
    },
  }
}

for (const [accent, variant] of [['dark', 'he'], ['pink', 'she']]) {
  test(`${variant} favicon follows start, pause, resume, stop and completion in the shared display`, () => {
    const app = appearance(accent)
    const timer = app.timer()
    const cases = [
      [{}, 'ready', false],
      [{ isRunning: true }, 'running', true],
      [{ isRunning: true, isPaused: true }, 'paused', false],
      [{ isRunning: true }, 'running', true],
      [{}, 'ready', false],
      [{ isRunning: true }, 'running', true],
      // Completion wins before the timer's auto-stop effect has run.
      [{ isRunning: true, isComplete: true }, 'complete', false],
    ]
    for (const [state, displayState, active] of cases) {
      assert.equal(timer.render(state).props['data-state'], displayState)
      assert.equal(app.active(), active && accent === 'dark')
      assert.equal(app.favicon(), `/favicon-${variant}${active ? '-active' : ''}.svg`)
    }
    timer.unmount()
    assert.equal(app.favicon(), `/favicon-${variant}.svg`)
  })
}

test('switching styles during a session only activates He and preserves unrelated root classes', () => {
  const app = appearance()
  const timer = app.timer()
  for (const accent of ['pink', 'dark', 'pink', 'dark']) {
    app.setAccent(accent)
    timer.render({ isRunning: true })
    assert.equal(app.active(), accent === 'dark')
    assert.equal(app.favicon(), `/favicon-${accent === 'pink' ? 'she' : 'he'}-active.svg`)
  }
  timer.unmount()
  assert.deepEqual([...app.classes].sort(), ['dark', 'existing-class'])
  assert.equal(app.favicon(), '/favicon-he.svg')
})

test('idle styles update the favicon and legacy neutral preferences become He', () => {
  const app = appearance(null)
  assert.equal(app.accent(), 'dark')
  assert.equal(app.variant(), 'he')
  assert.equal(app.favicon(), '/favicon-he.svg')
  assert.equal(app.setAccent('pink'), 'pink')
  assert.equal(app.variant(), 'she')
  assert.equal(app.favicon(), '/favicon-she.svg')
  assert.equal(app.setAccent('neutral'), 'dark')
  assert.equal(app.stored(), 'dark')
  assert.equal(app.accent(), 'dark')
  assert.equal(app.variant(), 'he')
  assert.equal(app.favicon(), '/favicon-he.svg')
})

test('overlapping timer mounts cannot clear another session; navigation removes the last registration', () => {
  const app = appearance()
  const personal = app.timer()
  const room = app.timer()
  const idle = app.timer()
  personal.render({ isRunning: true })
  room.render({ isRunning: true })
  idle.render()
  assert.equal(app.active(), true)
  personal.unmount()
  idle.unmount()
  assert.equal(app.active(), true)
  assert.equal(app.favicon(), '/favicon-he-active.svg')
  room.unmount()
  assert.equal(app.active(), false)
  assert.equal(app.favicon(), '/favicon-he.svg')

  // Remounting after cleanup also covers the development Strict Mode lifecycle.
  const remounted = app.timer()
  remounted.render({ isRunning: true })
  assert.equal(app.active(), true)
  remounted.unmount()
  assert.equal(app.active(), false)
})
