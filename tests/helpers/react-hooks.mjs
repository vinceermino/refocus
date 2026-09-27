import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import React from 'react'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const sameDependencies = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]))

// A small deterministic hook lifecycle harness, following the timer tests' source
// loader. It exercises request ordering and cleanup, not React's DOM rendering.
export function createHookHarness() {
  const hooks = []
  let cursor = 0
  let effects = []
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++
      hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial }
      return [hooks[index].value, next => { hooks[index].value = typeof next === 'function' ? next(hooks[index].value) : next }]
    },
    useRef(initial) {
      const index = cursor++
      hooks[index] ??= { current: initial }
      return hooks[index]
    },
    useCallback(callback, dependencies) {
      const index = cursor++
      if (!sameDependencies(hooks[index]?.dependencies, dependencies)) hooks[index] = { callback, dependencies }
      return hooks[index].callback
    },
    useMemo(factory, dependencies) {
      const index = cursor++
      if (!sameDependencies(hooks[index]?.dependencies, dependencies)) hooks[index] = { value: factory(), dependencies }
      return hooks[index].value
    },
    useEffect(effect, dependencies) {
      const index = cursor++
      if (!sameDependencies(hooks[index]?.dependencies, dependencies)) {
        const previous = hooks[index]
        hooks[index] = { dependencies, cleanup: previous?.cleanup }
        effects.push(() => {
          previous?.cleanup?.()
          hooks[index].cleanup = effect()
        })
      }
    },
  }
  const flushEffects = () => { const queued = effects; effects = []; queued.forEach(effect => effect()) }
  return {
    react,
    render(render, runEffects = true) {
      cursor = 0
      const output = render()
      if (runEffects) flushEffects()
      return output
    },
    flushEffects,
    unmount() { hooks.forEach(hook => hook.cleanup?.()) },
  }
}

export function loadSource(relativePath, overrides, globals = {}) {
  const filename = path.join(root, relativePath)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const compiled = { exports: {} }
  vm.runInNewContext(source, {
    module: compiled,
    exports: compiled.exports,
    require: name => name in overrides ? overrides[name] : require(name),
    AbortController,
    Error,
    ...globals,
  }, { filename })
  return compiled.exports
}

export function deferred() {
  let resolve, reject
  const promise = new Promise((success, failure) => { resolve = success; reject = failure })
  return { promise, resolve, reject }
}

export function browserEvents() {
  const timeouts = new Map()
  const intervals = new Map()
  const listeners = new Map()
  let nextId = 0
  return {
    window: {
      setTimeout: callback => { timeouts.set(++nextId, callback); return nextId },
      clearTimeout: id => timeouts.delete(id),
      setInterval: callback => { intervals.set(++nextId, callback); return nextId },
      clearInterval: id => intervals.delete(id),
      addEventListener: (event, callback) => {
        if (!listeners.has(event)) listeners.set(event, new Set())
        listeners.get(event).add(callback)
      },
      removeEventListener: (event, callback) => listeners.get(event)?.delete(callback),
    },
    document: { visibilityState: 'visible' },
    flushTimeouts() { const queued = [...timeouts.values()]; timeouts.clear(); queued.forEach(callback => callback()) },
    dispatch(event) { listeners.get(event)?.forEach(callback => callback()) },
    tickIntervals() { intervals.forEach(callback => callback()) },
  }
}

export const flushPromises = () => new Promise(resolve => setImmediate(resolve))
