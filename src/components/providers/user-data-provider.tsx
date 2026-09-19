'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

interface UserData {
  profile: UserProfile | null
  rooms: UserRoom[]
  stats: StudyStats | null
  error: string | null
  isLoading: boolean
  isRefreshingStats: boolean
  refreshAll: () => Promise<void>
  refreshRooms: () => Promise<void>
  refreshStats: () => Promise<void>
}

const UserDataContext = createContext<UserData>({
  profile: null,
  rooms: [],
  stats: null,
  error: null,
  isLoading: true,
  isRefreshingStats: false,
  refreshAll: async () => { },
  refreshRooms: async () => { },
  refreshStats: async () => { },
})

export function UserDataProvider({ children, initialData }: { children: ReactNode, initialData?: Partial<UserData> | null }) {
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(initialData?.profile || null)
  const [rooms, setRooms] = useState<UserRoom[]>(initialData?.rooms || [])
  const [stats, setStats] = useState<StudyStats | null>(initialData?.stats || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)
  const [hasFetched, setHasFetched] = useState(!!initialData)

  const fetchAll = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true)
      }
      const res = await fetch('/api/user-data')
      if (!res.ok) {
        throw new Error(res.status === 401
          ? 'Your session has ended. Sign in to load your study data.'
          : 'Unable to load your study data. Check your connection and try again.')
      }
      const data = await res.json()
      setError(null)
      setProfile(data.profile)
      setRooms(data.rooms)
      setStats(data.stats)
      setHasFetched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your study data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/user-data')
      if (!res.ok) throw new Error('Unable to refresh your study data. Please try again.')
      const data = await res.json()
      setRooms(data.rooms)
      // Also update profile since totalStudyTime might have changed
      setError(null)
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh your rooms.')
    }
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      setIsRefreshingStats(true)
      const res = await fetch('/api/user-data')
      if (!res.ok) throw new Error('Unable to refresh your study data. Please try again.')
      const data = await res.json()
      setStats(data.stats)
      setError(null)
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh your stats.')
    } finally {
      setIsRefreshingStats(false)
    }
  }, [])

  // Fetch once on mount (only runs in browser)
  useEffect(() => {
    if (!hasFetched) {
      // Schedule the initial request; cleanup avoids a duplicate request in Strict Mode.
      const request = window.setTimeout(() => { void fetchAll() }, 0)
      return () => window.clearTimeout(request)
    }
  }, [hasFetched, fetchAll])

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchAll(false)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setRooms([])
        setStats(null)
        setHasFetched(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchAll])

  return (
    <UserDataContext.Provider
      value={{
        profile,
        error,
        rooms,
        stats,
        isLoading,
        isRefreshingStats,
        refreshAll: fetchAll,
        refreshRooms,
        refreshStats,
      }}
    >
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  return useContext(UserDataContext)
}
