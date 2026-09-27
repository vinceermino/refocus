'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { watchServiceWorkerUpdates } from '@/lib/pwa-updates'
import { hasActiveTimer } from '@/lib/timer-activity'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const InstallContext = createContext({ available: false, install: () => {} })
const noSubscription = () => () => {}
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
const subscribeDisplay = (notify: () => void) => {
  const media = window.matchMedia('(display-mode: standalone)')
  media.addEventListener('change', notify)
  window.addEventListener('appinstalled', notify)
  return () => { media.removeEventListener('change', notify); window.removeEventListener('appinstalled', notify) }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const ios = useSyncExternalStore(noSubscription, isIOS, () => false)
  const installed = useSyncExternalStore(subscribeDisplay, standalone, () => false)

  useEffect(() => {
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt) }
    const installed = () => { setPrompt(null); toast.success('ReFocus is installed.') }
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', installed)
    return () => { window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed) }
  }, [])

  useEffect(() => {
    const updateMetadata = () => {
      const root = document.documentElement
      const variant = root.dataset.accent === 'pink' ? 'she' : 'he'
      const setChanged = (selector: string, attribute: string, value: string) => {
        const element = document.querySelector(selector)
        if (element?.getAttribute(attribute) !== value) element?.setAttribute(attribute, value)
      }
      setChanged('#app-manifest', 'href', `/manifest-${variant}.webmanifest`)
      setChanged('#apple-touch-icon', 'href', `/icons/${variant}/180.png`)
      setChanged('#app-theme-color', 'content', getComputedStyle(root).getPropertyValue('--background').trim())
    }
    updateMetadata()
    const observer = new MutationObserver(updateMetadata)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent'] })
    window.addEventListener('refocus-variant-change', updateMetadata)
    return () => { observer.disconnect(); window.removeEventListener('refocus-variant-change', updateMetadata) }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    let disposed = false
    let cleanup: (() => void) | undefined
    let registration: ServiceWorkerRegistration | undefined
    const announce = (refresh: (() => void) | null) => {
      toast.info(refresh ? 'A fresh version of ReFocus is ready.' : 'An update is ready. Finish your timer to refresh.', {
        id: 'pwa-update', duration: Infinity,
        action: refresh ? { label: 'Refresh', onClick: () => { if (!hasActiveTimer()) refresh() } } : undefined,
      })
    }
    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        if (!disposed) cleanup = watchServiceWorkerUpdates(registration, announce)
      } catch (error) { console.warn('Offline support could not be enabled.', error) }
    }
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void registration?.update().catch(() => {})
    }
    // Defer until after load; registration never blocks hydration or the timer.
    let scheduled: number | undefined
    const afterLoad = () => { scheduled = window.setTimeout(() => { if (!disposed) void register() }, 0) }
    if (document.readyState === 'complete') afterLoad()
    else window.addEventListener('load', afterLoad, { once: true })
    document.addEventListener('visibilitychange', check)
    window.addEventListener('online', check)
    return () => {
      disposed = true
      window.clearTimeout(scheduled)
      cleanup?.()
      toast.dismiss('pwa-update')
      window.removeEventListener('load', afterLoad)
      window.removeEventListener('online', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  const install = useCallback(() => {
    if (prompt) {
      void prompt.prompt().then(() => prompt.userChoice).then(() => setPrompt(null)).catch(() => { setPrompt(null); toast.info('Use your browser menu to install ReFocus.') })
    } else if (ios) {
      toast.info('Install ReFocus', { description: 'In Safari, tap Share, then Add to Home Screen.', duration: 10000 })
    }
  }, [prompt, ios])
  const value = useMemo(() => ({ available: !installed && Boolean(prompt || ios), install }), [installed, prompt, ios, install])
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}

export function InstallButton() {
  const { available, install } = useContext(InstallContext)
  // Reserve the slot before eligibility arrives so the mobile nav never reflows.
  return <span className="inline-flex h-10 w-10 shrink-0 sm:w-[78px]">
    {available && <button type="button" onClick={install} className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm text-foreground hover:bg-muted" aria-label="Install ReFocus"><Download aria-hidden="true" className="h-4 w-4 sm:hidden" /><span className="sr-only sm:not-sr-only">Install</span></button>}
  </span>
}
