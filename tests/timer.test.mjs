import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import React from 'react'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const loadPackage = createRequire(import.meta.url)

// Exercise real timer calculations and control callbacks with a deterministic
// clock. Browser focus, React subscriptions and server actions are not simulated.
function loadSource(relativePath, overrides = {}) {
  const filename = path.resolve(projectRoot, relativePath)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const compiledModule = { exports: {} }
  const localRequire = (name) => {
    if (name in overrides) return overrides[name]
    if (name.startsWith('@/')) {
      const base = `src/${name.slice(2)}`
      const extension = fs.existsSync(path.resolve(projectRoot, `${base}.ts`)) ? '.ts' : '.tsx'
      return loadSource(`${base}${extension}`, overrides)
    }
    return loadPackage(name)
  }
  vm.runInNewContext(source, { module: compiledModule, exports: compiledModule.exports, require: localRequire }, { filename })
  return compiledModule.exports
}

const start = Date.parse('2026-09-19T00:00:00Z')
const { useLocalTimer: calculateTimer } = loadSource('src/hooks/use-local-timer.ts', {
  react: { ...React, useEffect: () => {} },
  '@/hooks/use-clock': { useClock: () => start + 30_000 },
})
const state = {
  id: null, mode: 'countdown', status: 'running', duration: 300,
  startedAt: new Date(start).toISOString(), elapsed: 10,
}

test('focus and rest count down selected durations including earlier elapsed time', () => {
  for (const mode of ['countdown', 'rest']) {
    const output = calculateTimer({ ...state, mode })
    assert.equal(output.displaySeconds, 260)
    assert.equal(output.isComplete, false)
    assert.equal(output.progress, 40 / 300)
  }
})

test('paused timers retain elapsed time and stopped timers reset their display', () => {
  assert.equal(calculateTimer({ ...state, status: 'paused' }).displaySeconds, 290)
  assert.equal(calculateTimer({ ...state, status: 'stopped' }).displaySeconds, 300)
  assert.equal(calculateTimer({ ...state, mode: 'stopwatch', status: 'stopped' }).displaySeconds, 0)
})

test('expired countdown completes at zero and stopwatch respects daily remaining time', () => {
  const countdown = calculateTimer({ ...state, duration: 20 })
  assert.equal(countdown.displaySeconds, 0)
  assert.equal(countdown.isComplete, true)
  const stopwatch = calculateTimer({ ...state, mode: 'stopwatch' }, 35)
  assert.equal(stopwatch.displaySeconds, 35)
  assert.equal(stopwatch.isComplete, true)
})

test('a start timestamp ahead of the latest clock tick never creates negative elapsed time', () => {
  const output = calculateTimer({ ...state, startedAt: new Date(start + 31_000).toISOString(), elapsed: 0 })
  assert.equal(output.displaySeconds, 300)
  assert.equal(output.progress, 0)
})

function findStart(element) {
  if (!element || typeof element !== 'object') return undefined
  const children = React.Children.toArray(element.props?.children)
  if (children.includes('Start') && element.props.onClick) return element
  return children.map(findStart).find(Boolean)
}

test('Start forwards the selected focus/rest duration and zero only for stopwatch', () => {
  const { TimerControls } = loadSource('src/components/timer/timer-controls.tsx', {
    react: { ...React, useState: (initial) => [initial, () => {}] },
  })
  for (const [mode, duration, expected] of [['countdown', 1500, 1500], ['rest', 300, 300], ['stopwatch', 300, 0]]) {
    let started
    const tree = TimerControls({
      isRunning: false, isPaused: false, isOwner: true, mode, duration,
      onStart: (seconds, selectedMode) => { started = [seconds, selectedMode] },
    })
    const button = findStart(tree)
    assert.ok(button, 'Start control must be present')
    button.props.onClick()
    assert.deepEqual(started, [expected, mode])
  }
})
