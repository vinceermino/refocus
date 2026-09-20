import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'

const requirePackage = createRequire(import.meta.url)
export function loadSource(relativePath, overrides = {}) {
  const filename = path.resolve(relativePath)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const compiledModule = { exports: {} }
  const require = name => {
    if (name in overrides) return overrides[name]
    if (name.startsWith('@/')) {
      const base = `src/${name.slice(2)}`
      return loadSource(`${base}${fs.existsSync(`${base}.ts`) ? '.ts' : '.tsx'}`, overrides)
    }
    return requirePackage(name)
  }
  vm.runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, require, Date, Set, Map, FormData, console, ...overrides.globals }, { filename })
  return compiledModule.exports
}
