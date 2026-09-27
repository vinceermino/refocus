import assets from './theme-assets.generated.json'
export type Variant = 'she' | 'he'
export { assets as themeAssets }

const pending = new Map<Variant, Promise<void>>()
export function loadTheme(variant: Variant) {
  if (pending.has(variant)) return pending.get(variant)!
  const promise = new Promise<void>((resolve, reject) => {
    let link = document.getElementById(`theme-${variant}`) as HTMLLinkElement | null
    if (link?.sheet || link?.dataset.loaded === 'true') { resolve(); return }
    const created = !link
    link ??= document.createElement('link')
    link.id = `theme-${variant}`
    link.rel = 'stylesheet'
    link.href = assets[variant].css
    const timeout = window.setTimeout(() => { cleanup(); link!.remove(); reject(new Error('Unable to load this style. Please try again.')) }, 10_000)
    const done = () => { link!.dataset.loaded = 'true'; cleanup(); resolve() }
    const fail = () => { cleanup(); link!.remove(); reject(new Error('Unable to load this style. Check your connection.')) }
    const cleanup = () => { window.clearTimeout(timeout); link!.removeEventListener('load', done); link!.removeEventListener('error', fail) }
    link.addEventListener('load', done)
    link.addEventListener('error', fail)
    if (created) document.head.appendChild(link)
  })
  pending.set(variant, promise)
  void promise.catch(() => pending.delete(variant))
  return promise
}
