import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const executablePath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium'].find(existsSync)
const browser = await puppeteer.launch({ executablePath, headless: true, defaultViewport: { width: 390, height: 844 } })
const results = []
try {
  for (const [variant, fullscreen] of [['he', false], ['she', false], ['he', true], ['she', true]]) {
    const page = await browser.newPage()
    const url = process.env.TEST_URL || 'http://localhost:3100/'
    await page.goto(new URL('/favicon-he.svg', url).href)
    await page.evaluate(({ variant, fullscreen }) => { localStorage.setItem('accent-theme', variant === 'she' ? 'pink' : 'dark'); localStorage.setItem('fullscreenOnStart', String(fullscreen)) }, { variant, fullscreen })
    await page.goto(url, { waitUntil: 'networkidle0' })
    const cdp = await page.createCDPSession()
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.evaluate(() => {
      window.interactions = []
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) window.interactions.push({ type: entry.name, id: entry.interactionId, duration: entry.duration }) }).observe({ type: 'event', buffered: false, durationThreshold: 16 })
    })
    for (const text of ['Start', 'Pause', 'Resume']) {
      await (await page.waitForSelector(`xpath///button[normalize-space(.)='${text}']`)).click()
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    }
    const frames = await page.evaluate(() => new Promise(resolve => {
      const times = []; let previous
      const next = time => { if (previous !== undefined) times.push(time - previous); previous = time; if (times.length === 120) resolve(times); else requestAnimationFrame(next) }
      requestAnimationFrame(next)
    }))
    if (fullscreen) await page.click('[aria-label="Exit timer fullscreen"]')
    for (const text of ['Stop', 'Stop Timer']) await (await page.waitForSelector(`xpath///button[normalize-space(.)='${text}']`)).click()
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)))
    const interactions = await page.evaluate(() => window.interactions)
    frames.sort((a, b) => a - b)
    const result = { variant, fullscreen, cpuSlowdown: 4, maxInteractionMs: Math.max(0, ...interactions.map(entry => entry.duration)), frameMedianMs: frames[60], frameP95Ms: frames[114], framesOver34ms: frames.filter(time => time > 34).length, sampledFrames: frames.length, interactions }
    results.push(result)
    console.log(JSON.stringify(result))
    await page.close()
  }
  await mkdir('artifacts/performance', { recursive: true })
  await writeFile('artifacts/performance/interactions.json', JSON.stringify(results, null, 2))
} finally { await browser.close() }
