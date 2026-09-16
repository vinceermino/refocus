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
  isLoading: true,
  isRefreshingStats: false,
  refreshAll: async () => { },
  refreshRooms: async () => { },
  refreshStats: async () => { },
})

export function UserDataProvider({ children, initialData }: { children: ReactNode, initialData?: Partial<UserData> | null }) {
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
        // Not authenticated or error — just stop loading
        setIsLoading(false)
        return
      }
      const data = await res.json()
      setProfile(data.profile)
      setRooms(data.rooms)
      setStats(data.stats)
      setHasFetched(true)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/user-data')
      if (!res.ok) return
      const data = await res.json()
      setRooms(data.rooms)
      // Also update profile since totalStudyTime might have changed
      setProfile(data.profile)
    } catch (err) {
      console.error('Failed to refresh rooms:', err)
    }
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      setIsRefreshingStats(true)
      const res = await fetch('/api/user-data')
      if (!res.ok) return
      const data = await res.json()
      setStats(data.stats)
      setProfile(data.profile)
    } catch (err) {
      console.error('Failed to refresh stats:', err)
    } finally {
      setIsRefreshingStats(false)
    }
  }, [])

  // Fetch once on mount (only runs in browser)
  useEffect(() => {
    if (!hasFetched) {
      fetchAll()
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
