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

interface UserProfile {
  id: string
  username: string
  avatarUrl: string | null
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
  refreshAll: () => Promise<void>
  refreshRooms: () => Promise<void>
  refreshStats: () => Promise<void>
}

const UserDataContext = createContext<UserData>({
  profile: null,
  rooms: [],
  stats: null,
  isLoading: true,
  refreshAll: async () => {},
  refreshRooms: async () => {},
  refreshStats: async () => {},
})

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [rooms, setRooms] = useState<UserRoom[]>([])
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true)
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
      const res = await fetch('/api/user-data')
      if (!res.ok) return
      const data = await res.json()
      setStats(data.stats)
      setProfile(data.profile)
    } catch (err) {
      console.error('Failed to refresh stats:', err)
    }
  }, [])

  // Fetch once on mount (only runs in browser)
  useEffect(() => {
    if (!hasFetched) {
      fetchAll()
    }
  }, [hasFetched, fetchAll])

  return (
    <UserDataContext.Provider
      value={{
        profile,
        rooms,
        stats,
        isLoading,
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
