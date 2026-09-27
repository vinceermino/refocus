import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { generateSW } from 'workbox-build'

const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 16)
const version = hash(await readFile('.next/BUILD_ID'))
const offline = await readFile('.next/server/app/offline.html', 'utf8')
const shellAssets = [...new Set([...offline.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)(?:\?[^\"]*)?"/g)].map(match => match[1]))]
if (!shellAssets.some(url => url.endsWith('.js'))) throw new Error('Offline shell has no JavaScript assets')
const additionalManifestEntries = [{ url: '/offline', revision: hash(offline) }]
for (const url of shellAssets) {
  additionalManifestEntries.push({ url, revision: null }) // Next filenames are content hashed.
}
const publicFiles = await readdir('public', { recursive: true })
for (const name of publicFiles) {
  const file = name.replaceAll('\\', '/')
  if (!/^(icons\/.*\.png|fonts\/.*\.woff2|themes\/.*\.svg|favicon.*\.svg|manifest.*\.webmanifest)$/.test(file)) continue
  additionalManifestEntries.push({ url: `/${file}`, revision: hash(await readFile(`public/${file}`)) })
}
const themes = JSON.parse(await readFile('src/lib/theme-assets.generated.json', 'utf8'))
for (const theme of Object.values(themes)) {
  additionalManifestEntries.push({ url: theme.css, revision: null })
}

const cachePrefix = 'refocus-runtime-'
const staticCache = `${cachePrefix}${version}-static`
const iconCache = `${cachePrefix}${version}-icons`
const dataCache = `${cachePrefix}${version}-public-data`
// Only this application's runtime caches are cleaned; Workbox manages revisions
// of the precache itself. Never delete another application's caches on this origin.
await writeFile('public/sw-lifecycle.js', `self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('${cachePrefix}') && !${JSON.stringify([staticCache, iconCache, dataCache])}.includes(key)).map(key => caches.delete(key))))); });\n`)

const { count, warnings } = await generateSW({
  swDest: 'public/sw.js', globDirectory: 'public', globPatterns: [],
  additionalManifestEntries, cacheId: 'refocus', cleanupOutdatedCaches: true,
  skipWaiting: false, clientsClaim: true, sourcemap: false, inlineWorkboxRuntime: true,
  importScripts: ['/sw-lifecycle.js'],
  runtimeCaching: [
    {
      // All existing API responses contain account or room data. Always use the
      // network and never store them, even when the browser is offline.
      urlPattern: ({ url, request, sameOrigin }) => sameOrigin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.searchParams.has('_rsc') || request.headers.has('RSC') || request.headers.has('Next-Action')),
      handler: 'NetworkOnly',
    },
    {
      urlPattern: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
      handler: 'NetworkOnly', options: { precacheFallback: { fallbackURL: '/offline' } },
    },
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/icons/'),
      handler: 'CacheFirst', options: { cacheName: iconCache, expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 90 }, cacheableResponse: { statuses: [200] } },
    },
    {
      // An explicit public-data allowlist. Expand only for anonymous endpoints;
      // private APIs above intentionally never fall back to cached responses.
      urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/manifest(?:-(?:she|he))?\.webmanifest$/.test(url.pathname),
      handler: 'NetworkFirst', options: { cacheName: dataCache, networkTimeoutSeconds: 3, expiration: { maxEntries: 3 }, cacheableResponse: { statuses: [200] } },
    },
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/themes/') || url.pathname.startsWith('/fonts/')),
      handler: 'StaleWhileRevalidate', options: { cacheName: staticCache, expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [200] } },
    },
  ],
})
warnings.forEach(warning => console.warn(warning))
console.log(`PWA ${version}: precached ${count} versioned shell and asset files.`)
