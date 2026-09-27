import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHookHarness, loadSource } from './helpers/react-hooks.mjs'

// Exercise the shared display and effect cleanup; the existing timer suite owns
// elapsed-time calculations. No DOM renderer or live account is required.
function appearance() {
  let accent = 'dark'
  let currentHarness
  const classes = new Set(['dark', 'existing-class'])
  const document = { documentElement: { classList: {
    add: value => classes.add(value),
    toggle: (value, active) => active ? classes.add(value) : classes.delete(value),
  } } }
  const react = { useEffect: (...args) => currentHarness.react.useEffect(...args) }
  const hook = loadSource('src/hooks/use-timer-appearance.ts', {
    react,
    '@/components/providers/accent-provider': { useAccent: () => ({ accent }) },
  }, { document })
  const { TimerDisplay } = loadSource('src/components/timer/timer-display.tsx', {
    '@/hooks/use-timer-appearance': hook,
    '@/hooks/use-clock': { useClock: () => null },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' '), formatTime: String },
  })
  return {
    classes,
    setAccent(value) { accent = value },
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

test('He presentation follows start, pause, resume, stop and completion in the shared display', () => {
  const app = appearance()
  const timer = app.timer()
  const cases = [
    [{}, 'ready', false],
    [{ isRunning: true }, 'running', true],
    [{ isPaused: true }, 'paused', false],
    [{ isRunning: true }, 'running', true],
    [{}, 'ready', false],
    [{ isRunning: true }, 'running', true],
    // Completion wins before the timer's auto-stop effect has run.
    [{ isRunning: true, isComplete: true }, 'complete', false],
  ]
  for (const [state, displayState, active] of cases) {
    assert.equal(timer.render(state).props['data-state'], displayState)
    assert.equal(app.active(), active)
  }
  timer.unmount()
})

test('switching styles during a session only activates He and preserves unrelated root classes', () => {
  const app = appearance()
  const timer = app.timer()
  for (const accent of ['pink', 'neutral', 'dark', 'pink', 'dark']) {
    app.setAccent(accent)
    timer.render({ isRunning: true })
    assert.equal(app.active(), accent === 'dark')
  }
  timer.unmount()
  assert.deepEqual([...app.classes].sort(), ['dark', 'existing-class'])
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
  room.unmount()
  assert.equal(app.active(), false)

  // Remounting after cleanup also covers the development Strict Mode lifecycle.
  const remounted = app.timer()
  remounted.render({ isRunning: true })
  assert.equal(app.active(), true)
  remounted.unmount()
  assert.equal(app.active(), false)
})
