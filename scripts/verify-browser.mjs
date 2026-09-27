import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const url = process.env.TEST_URL || 'http://localhost:3100/'
const executablePath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium'].find(existsSync)
await mkdir('artifacts/browser', { recursive: true })
const browser = await puppeteer.launch({ executablePath, headless: true, defaultViewport: { width: 1280, height: 900 } })
const page = await browser.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const clickText = async text => {
  const button = await page.waitForSelector(`xpath///button[normalize-space(.)='${text}']`)
  await button.click()
}
const checkLayout = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'No horizontal overflow')
const screenshot = name => page.screenshot({ path: `artifacts/browser/${name}.png`, fullPage: true })
const setOffline = async offline => {
  await page.setOfflineMode(offline)
  // Chrome gives service workers a separate network target. Throttle it too,
  // otherwise page-only offline emulation still lets SW fetch reach the server.
  for (const target of browser.targets().filter(target => target.type() === 'service_worker')) {
    const cdp = await target.createCDPSession()
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  }
}
let originalWorker
try {
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  assert.equal(await page.$eval('#app-manifest', el => el.getAttribute('href')), '/manifest-he.webmanifest')
  await checkLayout(); await screenshot('he-desktop')
  const firstStyles = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name).filter(n => n.includes('/theme.css')))
  assert.equal(firstStyles.some(n => n.includes('/themes/she/')), false, 'Initial render loads only He stylesheet')
  await page.click('input[type=checkbox]')
  assert.equal(await page.evaluate(() => localStorage.getItem('fullscreenOnStart')), 'true')
  await clickText('Start')
  await page.waitForFunction(() => document.fullscreenElement?.classList.contains('timer-panel'))
  await page.waitForFunction(() => document.querySelector('.timer-panel').dataset.fullscreen === 'true')
  await screenshot('he-fullscreen')
  await clickText('Pause')
  assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true)
  await clickText('Resume')
  await page.click('[aria-label="Exit timer fullscreen"]')
  await page.waitForFunction(() => !document.fullscreenElement)
  assert.equal(await page.$eval('.timer-display', el => el.dataset.state), 'running')
  await clickText('Stop'); await clickText('Stop Timer')
  await page.waitForFunction(() => document.querySelector('.timer-display').dataset.state === 'ready')
  await clickText('Start'); await page.waitForFunction(() => Boolean(document.fullscreenElement))
  await clickText('Stop'); await clickText('Stop Timer')
  await page.waitForFunction(() => !document.fullscreenElement)

  await clickText('5m'); await clickText('Start')
  await page.waitForFunction(() => Boolean(document.fullscreenElement))
  await page.evaluate(() => { window.realDateNow = Date.now; Date.now = () => window.realDateNow() + 301000 })
  await page.waitForFunction(() => !document.fullscreenElement && document.querySelector('.timer-display').dataset.state === 'ready')
  await page.evaluate(() => { Date.now = window.realDateNow })

  await page.click('[aria-label="Choose your style"]')
  await page.click('.theme-option:first-child')
  await page.waitForFunction(() => document.documentElement.dataset.accent === 'pink')
  assert.equal(await page.$eval('#app-manifest', el => el.getAttribute('href')), '/manifest-she.webmanifest')
  await screenshot('she-desktop')
  await page.reload({ waitUntil: 'networkidle0' })
  assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), 'pink')
  assert.equal(await page.$eval('input[type=checkbox]', el => el.checked), true)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await clickText('Start'); await page.waitForFunction(() => Boolean(document.fullscreenElement))
  assert.equal(await page.$eval('.fullscreen-decoration i', el => getComputedStyle(el).animationName), 'none')
  await screenshot('she-fullscreen-reduced-motion')
  await clickText('Stop'); await clickText('Stop Timer')
  await page.waitForFunction(() => !document.fullscreenElement)
  await page.emulateMediaFeatures([])
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 })
  await checkLayout(); await screenshot('she-mobile')
  await page.click('[aria-label="Minimal mode"]')

  await page.setViewport({ width: 320, height: 640, isMobile: true, deviceScaleFactor: 1 })
  await checkLayout(); await screenshot('she-small-mobile-minimal')
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 })
  await page.reload({ waitUntil: 'networkidle0' })
  assert.equal(await page.evaluate(() => document.documentElement.dataset.minimal), 'true')
  await checkLayout(); await screenshot('she-mobile-minimal')
  await page.click('[aria-label="Minimal mode"]')

  // Native install prompts depend on browser eligibility; exercise the event contract.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = async () => { window.installWasPrompted = true }
    event.userChoice = Promise.resolve({ outcome: 'dismissed' })
    window.dispatchEvent(event)
  })
  await page.click('[aria-label="Install ReFocus"]')
  assert.equal(await page.evaluate(() => window.installWasPrompted), true)

  const keys = await page.evaluate(async () => {
    await fetch('/api/user-data').catch(() => {})
    await fetch('/login').catch(() => {})
    await fetch('/dashboard?_rsc=pwa-check', { headers: { RSC: '1' } }).catch(() => {})
    return (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(r => r.url)))).flat()
  })
  assert.equal(keys.some(key => /\/api\/|\/login|\/dashboard|_rsc=/.test(key)), false, 'Private data, documents and RSC are not cached')
  await setOffline(true)
  await page.goto(new URL('/dashboard', url).href, { waitUntil: 'networkidle0' })
  await page.waitForSelector('h1')
  assert.match(await page.$eval('h1', el => el.textContent), /quiet moment/i)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), 'pink')
  await screenshot('offline-mobile')
  await page.click('[aria-label="Choose your style"]'); await page.click('.theme-option:last-child')
  await page.waitForFunction(() => document.documentElement.dataset.accent === 'dark')
  await clickText('Start'); await page.waitForFunction(() => document.querySelector('.timer-display').dataset.state === 'running')
  await clickText('Stop'); await clickText('Stop Timer')
  await page.waitForFunction(() => !document.fullscreenElement)
  await setOffline(false)
  await page.goto(url, { waitUntil: 'networkidle0' })

  // Install a genuinely changed worker and verify the update guard in the browser.
  originalWorker = await readFile('public/sw.js', 'utf8')
  await page.evaluate(async () => { await caches.open('refocus-runtime-obsolete-test'); await caches.open('unrelated-app-test') })
  await clickText('Start'); await page.waitForFunction(() => Boolean(document.fullscreenElement))
  await page.click('[aria-label="Exit timer fullscreen"]')
  await writeFile('public/sw.js', `${originalWorker}\n// Browser update verification ${Date.now()}\n`)
  await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update() })
  await page.waitForFunction(() => document.body.innerText.includes('Finish your timer to refresh.'), { timeout: 30000 })
  await clickText('Pause')
  assert.equal(await page.$eval('.timer-display', el => el.dataset.state), 'paused')
  await clickText('Stop'); await clickText('Stop Timer')
  await page.waitForFunction(() => document.body.innerText.includes('A fresh version of ReFocus is ready.'))
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), clickText('Refresh')])
  assert.equal(await page.$eval('.timer-display', el => el.dataset.state), 'ready')
  const cacheNames = await page.evaluate(() => caches.keys())
  assert.equal(cacheNames.includes('refocus-runtime-obsolete-test'), false)
  assert.equal(cacheNames.includes('unrelated-app-test'), true)
  for (const variant of ['he', 'she']) {
    const manifest = JSON.parse(await readFile(`public/manifest-${variant}.webmanifest`, 'utf8'))
    assert.equal(manifest.id, '/')
    assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'))
    for (const size of [180, 192, 256, 384, 512]) {
      const { width, height } = await sharp(`public/icons/${variant}/${size}.png`).metadata()
      assert.equal(width, size); assert.equal(height, size)
    }
  }
  assert.deepEqual(errors, [])
  console.log('PASS: variant persistence, fullscreen lifecycle, reduced motion, mobile/minimal layouts, install event, offline timer/style switch, private-cache exclusions, worker update guard and cache cleanup, icon dimensions; no browser page errors.')
} catch (error) {
  await screenshot('failure').catch(() => {})
  console.error('Browser errors:', errors)
  throw error
} finally {
  if (originalWorker) await writeFile('public/sw.js', originalWorker)
  await browser.close()
}
