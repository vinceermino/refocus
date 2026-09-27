'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { StudyStats } from '@/actions/stats'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  username: string
  genderPref: string
  totalStudyTime: number
}

interface UserRoom {
  id: string
  name: string
  code: string
  _count: { members: number }
  timers: Array<{ status: string; mode: string }>
}

interface UserDataSnapshot {
  profile: UserProfile | null
  rooms: UserRoom[]
  stats: StudyStats | null
}

interface UserData extends UserDataSnapshot {
  error: string | null
  isLoading: boolean
  isRefreshingStats: boolean
  refreshAll: () => Promise<void>
  refreshRooms: () => Promise<void>
  refreshStats: () => Promise<void>
  applyStats: (stats: StudyStats) => void
}

const emptyData: UserDataSnapshot = { profile: null, rooms: [], stats: null }

const UserDataContext = createContext<UserData>({
  ...emptyData,
  error: null,
  isLoading: true,
  isRefreshingStats: false,
  refreshAll: async () => {},
  refreshRooms: async () => {},
  refreshStats: async () => {},
  applyStats: () => {},
})

export function UserDataProvider({ children, initialData }: { children: ReactNode; initialData?: UserDataSnapshot | null }) {
  const [data, setData] = useState<UserDataSnapshot>(initialData ?? emptyData)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)
  const hasInitialData = useRef(Boolean(initialData))
  const authUserId = useRef<string | null | undefined>(undefined)
  const profileId = useRef(initialData?.profile?.id)
  const statsRevision = useRef(0)
  const pending = useRef<{ controller: AbortController; promise: Promise<void> } | null>(null)

  const cancelRequest = useCallback(() => {
    pending.current?.controller.abort()
    pending.current = null
  }, [])

  const clearUser = useCallback(() => {
    cancelRequest()
    profileId.current = undefined
    setData(emptyData)
    setError(null)
    setIsLoading(false)
    setIsRefreshingStats(false)
  }, [cancelRequest])

  const loadData = useCallback((showLoading: boolean, replacePending = true): Promise<void> => {
    // Background events share one request; a completed mutation needs a fresh read.
    if (!replacePending && authUserId.current === null) return Promise.resolve()
    if (!replacePending && pending.current) return pending.current.promise
    cancelRequest()
    const request = { controller: new AbortController(), promise: Promise.resolve() }
    const revision = statsRevision.current
    pending.current = request
    setIsLoading(showLoading)
    setIsRefreshingStats(!showLoading)
    request.promise = (async () => {
      try {
        const response = await fetch('/api/user-data', { cache: 'no-store', signal: request.controller.signal })
        if (!response.ok) {
          if (pending.current === request && [401, 403, 404].includes(response.status)) {
            profileId.current = undefined
            setData(emptyData)
          }
          throw new Error(response.status === 401 || response.status === 403
            ? 'Your session has ended. Sign in to load your study data.'
            : response.status === 404
            ? 'Your profile could not be found. Sign in again to load your study data.'
            : 'Unable to load your study data. Check your connection and try again.')
        }
        const next: UserDataSnapshot = await response.json()
        if (pending.current !== request || request.controller.signal.aborted) return
        profileId.current = next.profile?.id
        setData(previous => ({
          ...next,
          // A goal save can finish while an older background read is in flight.
          stats: revision === statsRevision.current ? next.stats : previous.stats,
        }))
        setError(null)
      } catch (err) {
        if (pending.current === request && !request.controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load your study data. Please try again.')
        }
      } finally {
        if (pending.current === request) {
          pending.current = null
          setIsLoading(false)
          setIsRefreshingStats(false)
        }
      }
    })()
    return request.promise
  }, [cancelRequest])

  const refreshAll = useCallback(() => loadData(true), [loadData])
  const refreshStats = useCallback(() => loadData(false), [loadData])
  const currentProfileId = data.profile?.id
  const applyStats = useCallback((stats: StudyStats) => {
    if (!currentProfileId || profileId.current !== currentProfileId) return
    statsRevision.current++
    setData(previous => ({ ...previous, stats }))
  }, [currentProfileId])

  useEffect(() => {
    const timeout = hasInitialData.current ? undefined : window.setTimeout(() => { void loadData(true, false) }, 0)
    return () => { window.clearTimeout(timeout); cancelRequest() }
  }, [loadData, cancelRequest])

  useEffect(() => {
    if (!currentProfileId) return
    const refresh = () => { if (document.visibilityState === 'visible') void loadData(false, false) }
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [currentProfileId, loadData])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null
      if (event === 'INITIAL_SESSION') {
        authUserId.current = nextUserId
        if (!nextUserId) {
          clearUser()
          setError('Your session has ended. Sign in to load your study data.')
        }
        else if (!hasInitialData.current) void loadData(true, false)
      } else if (event === 'SIGNED_OUT') {
        authUserId.current = null
        clearUser()
      } else if (event === 'SIGNED_IN') {
        const changedUser = authUserId.current !== nextUserId
        authUserId.current = nextUserId
        if (changedUser) clearUser()
        void loadData(changedUser, changedUser)
      }
    })
    return () => subscription.unsubscribe()
  }, [loadData, clearUser])

  return (
    <UserDataContext.Provider value={{
      ...data,
      error,
      isLoading,
      isRefreshingStats,
      refreshAll,
      refreshRooms: refreshStats,
      refreshStats,
      applyStats,
    }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  return useContext(UserDataContext)
}
