'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { requestJson } from '@/lib/client-api'

export function useApiResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const sequence = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const cancel = useCallback(() => { sequence.current++; controller.current?.abort() }, [])
  const refresh = useCallback(async () => {
    const request = ++sequence.current
    controller.current?.abort()
    controller.current = new AbortController()
    setIsLoading(true)
    try {
      const result = await requestJson<T>(url, { signal: controller.current.signal })
      if (request === sequence.current) { setData(result); setError(null) }
    } catch (err) {
      if (request === sequence.current) {
        // Do not retain private content when current authorization cannot be checked.
        setData(null)
        setError(err instanceof Error ? err.message : 'Unable to load. Please try again.')
      }
    } finally { if (request === sequence.current) setIsLoading(false) }
  }, [url])
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => { window.clearTimeout(timer); cancel() }
  }, [refresh, cancel])
  return { data, error, isLoading, refresh }
}
