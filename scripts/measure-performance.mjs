import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import lighthouse from 'lighthouse'

const label = process.argv[2] || 'after'
const url = process.env.TEST_URL || 'http://localhost:3100/'
const executablePath = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].find(existsSync)
if (!executablePath) throw new Error('Set CHROME_PATH to a Chromium browser')
await mkdir('artifacts/performance', { recursive: true })
for (const variant of ['he', 'she']) {
  const browser = await puppeteer.launch({ executablePath, headless: true })
  try {
    const page = await browser.newPage()
    // Seed preferences on an inert same-origin resource. Loading the app here
    // would install a worker and accidentally turn a cold audit into a warm one.
    await page.goto(new URL('/favicon-he.svg', url).href)
    await page.evaluate(variant => {
      localStorage.setItem('accent-theme', variant === 'she' ? 'pink' : 'dark')
      localStorage.setItem('theme', 'dark')
    }, variant)
    // Audit a cold network load while preserving only the saved style preference.
    for (const worker of await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(r => r.scope))) {
      await page.evaluate(async scope => (await navigator.serviceWorker.getRegistration(scope))?.unregister(), worker)
    }
    await page.evaluate(async () => { for (const key of await caches.keys()) await caches.delete(key) })
    const cdp = await page.createCDPSession()
    await cdp.send('Network.clearBrowserCache')
    await page.close()
    const result = await lighthouse(url, { port: Number(new URL(browser.wsEndpoint()).port), output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices'], disableStorageReset: true, logLevel: 'error' })
    await writeFile(`artifacts/performance/${label}-${variant}.json`, result.report)
    const { lhr } = result
    console.log(JSON.stringify({ label, variant, error: lhr.runtimeError, performance: lhr.categories.performance.score, accessibility: lhr.categories.accessibility.score, bestPractices: lhr.categories['best-practices'].score, lcp: lhr.audits['largest-contentful-paint'].numericValue, cls: lhr.audits['cumulative-layout-shift'].numericValue, tbt: lhr.audits['total-blocking-time'].numericValue, bytes: lhr.audits['total-byte-weight'].numericValue }))
  } finally { await browser.close() }
}
