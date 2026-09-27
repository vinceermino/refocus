'use client'

import { createContext, useContext } from 'react'
import type { StudyStats } from '@/actions/stats'

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

export interface UserDataSnapshot {
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

export const emptyData: UserDataSnapshot = { profile: null, rooms: [], stats: null }

// Guest/offline timers read this context without importing the account provider
// or its authentication SDK into their initial JavaScript bundle.
export const UserDataContext = createContext<UserData>({
  ...emptyData,
  error: null,
  isLoading: true,
  isRefreshingStats: false,
  refreshAll: async () => {},
  refreshRooms: async () => {},
  refreshStats: async () => {},
  applyStats: () => {},
})

export function useUserData() {
  return useContext(UserDataContext)
}
