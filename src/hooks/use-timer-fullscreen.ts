'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useStoredValue } from '@/hooks/use-stored-value'

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => void | Promise<void>; msRequestFullscreen?: () => void | Promise<void> }
type FullscreenDocument = Document & { webkitFullscreenElement?: Element; msFullscreenElement?: Element; webkitExitFullscreen?: () => void | Promise<void>; msExitFullscreen?: () => void | Promise<void> }
const currentElement = () => {
  const doc = document as FullscreenDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null
}
const noSubscription = () => () => {}
const supportsFullscreen = () => 'requestFullscreen' in document.documentElement || 'webkitRequestFullscreen' in document.documentElement || 'msRequestFullscreen' in document.documentElement

export function useTimerFullscreen(status: 'running' | 'paused' | 'stopped', complete: boolean, { keepOnPause = true } = {}) {
  const ref = useRef<FullscreenElement>(null)
  const mounted = useRef(false)
  const starting = useRef(false)
  const requestId = useRef(0)
  const [stored, setStored] = useStoredValue('fullscreenOnStart')
  const enabled = stored === 'true'
  const supported = useSyncExternalStore(noSubscription, supportsFullscreen, () => false)
  const [fullscreen, setFullscreen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const exit = useCallback(async () => {
    const doc = document as FullscreenDocument
    if (!ref.current || currentElement() !== ref.current) return
    try {
      const leave = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen
      await leave?.call(doc)
    } catch { if (mounted.current) setAnnouncement('Use Escape or your browser controls to leave fullscreen.') }
  }, [])

  useEffect(() => {
    mounted.current = true
    const element = ref.current
    const change = () => {
      const active = currentElement() === element
      setFullscreen(active)
      setAnnouncement(active ? 'Timer entered fullscreen.' : 'Timer exited fullscreen.')
    }
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange']
    events.forEach(event => document.addEventListener(event, change))
    return () => {
      mounted.current = false
      // Cancel the most recent request, including one started after this effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++
      events.forEach(event => document.removeEventListener(event, change))
      if (currentElement() === element) {
        const doc = document as FullscreenDocument
        const leave = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen
        try { void Promise.resolve(leave?.call(doc)).catch(() => {}) } catch { /* Browser already left fullscreen. */ }
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'stopped') starting.current = false
    if (complete || (status === 'stopped' && !starting.current) || (status === 'paused' && !keepOnPause)) {
      void exit()
    }
  }, [status, complete, fullscreen, keepOnPause, exit])

  const requestOnStart = useCallback(() => {
    starting.current = true
    const id = ++requestId.current
    const element = ref.current
    if (!enabled || !element) return
    const enter = element.requestFullscreen ?? element.webkitRequestFullscreen ?? element.msRequestFullscreen
    if (!enter) { setAnnouncement('Fullscreen is unavailable in this browser. Your timer still works.'); return }
    try {
      // Do not await a server action before this call: it needs the Start gesture.
      void Promise.resolve(enter.call(element)).then(() => {
        if (!mounted.current || id !== requestId.current) {
          if (currentElement() === element) {
            const doc = document as FullscreenDocument
            return (doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen)?.call(doc)
          }
        }
      }).catch(() => { if (mounted.current) setAnnouncement('Fullscreen could not open. Your timer still works.') })
    } catch { setAnnouncement('Fullscreen could not open. Your timer still works.') }
  }, [enabled])

  const cancelStart = useCallback(() => {
    starting.current = false
    requestId.current++
    void exit()
  }, [exit])
  const setEnabled = useCallback((value: boolean) => setStored(String(value)), [setStored])
  return { ref, enabled, setEnabled, supported, fullscreen, announcement, requestOnStart, cancelStart, exit }
}
