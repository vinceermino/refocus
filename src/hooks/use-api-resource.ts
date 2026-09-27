'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { requestJson } from '@/lib/client-api'

export function useApiResource<T>(url: string) {
  const [resource, setResource] = useState<{
    url: string
    data: T | null
    error: string | null
    isLoading: boolean
  }>({ url, data: null, error: null, isLoading: true })
  const sequence = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const activeUrl = useRef<string | null>(url)
  const cancel = useCallback(() => { sequence.current++; controller.current?.abort() }, [])
  const refresh = useCallback(async () => {
    // A mutation on the previous page may finish after navigation.
    if (activeUrl.current !== url) return
    const request = ++sequence.current
    controller.current?.abort()
    controller.current = new AbortController()
    setResource(previous => ({ url, data: previous.url === url ? previous.data : null, error: null, isLoading: true }))
    try {
      const result = await requestJson<T>(url, { signal: controller.current.signal })
      if (request === sequence.current) setResource({ url, data: result, error: null, isLoading: false })
    } catch (err) {
      if (request === sequence.current) {
        // Do not retain private content when current authorization cannot be checked.
        setResource({ url, data: null, error: err instanceof Error ? err.message : 'Unable to load. Please try again.', isLoading: false })
      }
    }
  }, [url])
  useEffect(() => {
    activeUrl.current = url
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => { activeUrl.current = null; window.clearTimeout(timer); cancel() }
  }, [url, refresh, cancel])
  // Hide the previous route's data during the render before its effect runs.
  const current = resource.url === url ? resource : { data: null, error: null, isLoading: true }
  return { data: current.data, error: current.error, isLoading: current.isLoading, refresh }
}
