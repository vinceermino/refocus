'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MAX_DAILY_SECONDS = 8 * 60 * 60

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

interface DailyData {
  date: string     // e.g. "Mon", "Tue"
  fullDate: string // e.g. "2026-09-15"
  seconds: number
}

interface RoomStudyData {
  roomName: string
  seconds: number
  color: string
}

export interface StudyStats {
  // Summary cards
  todaySeconds: number
  totalSeconds: number
  totalSessions: number
  averageSessionSeconds: number
  currentStreak: number
  longestStreak: number
  dailyLimit: number

  // Chart data
  weeklyData: DailyData[]
  roomBreakdown: RoomStudyData[]
}

const ROOM_COLORS = [
  '#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6',
]

export async function getStudyStats(): Promise<StudyStats> {
  const profile = await getAuthProfile()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  // 7 days ago (start of that day)
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // include today = 7 days

  // Fetch all sessions for the last 7 days
  const recentSessions = await prisma.timerSession.findMany({
    where: {
      profileId: profile.id,
      createdAt: { gte: sevenDaysAgo, lte: endOfToday },
    },
    select: { duration: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Build weekly data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyData: DailyData[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const daySeconds = recentSessions
      .filter(s => {
        const sDate = new Date(s.createdAt)
        return sDate.getFullYear() === d.getFullYear() &&
               sDate.getMonth() === d.getMonth() &&
               sDate.getDate() === d.getDate()
      })
      .reduce((sum, s) => sum + s.duration, 0)

    weeklyData.push({
      date: dayNames[d.getDay()],
      fullDate: dateStr,
      seconds: daySeconds,
    })
  }

  // Today's study time
  const todaySeconds = weeklyData[weeklyData.length - 1]?.seconds ?? 0

  // Total stats
  const totalStats = await prisma.timerSession.aggregate({
    where: { profileId: profile.id },
    _sum: { duration: true },
    _count: true,
    _avg: { duration: true },
  })

  const totalSeconds = totalStats._sum.duration ?? 0
  const totalSessions = totalStats._count ?? 0
  const averageSessionSeconds = Math.round(totalStats._avg.duration ?? 0)

  // Streaks — get all distinct study days
  const allSessions = await prisma.timerSession.findMany({
    where: { profileId: profile.id },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const studyDays = new Set<string>()
  allSessions.forEach(s => {
    const d = new Date(s.createdAt)
    studyDays.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  })

  const sortedDays = Array.from(studyDays).sort().reverse()
  let currentStreak = 0
  let longestStreak = 0

  if (sortedDays.length > 0) {
    // Check if today or yesterday is in the list (to start counting)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr) {
      // Count current streak
      let expectedDate = new Date(sortedDays[0])
      for (const dayStr of sortedDays) {
        const expStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`
        if (dayStr === expStr) {
          currentStreak++
          expectedDate.setDate(expectedDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Count longest streak from all sorted days (ascending)
    const ascending = Array.from(studyDays).sort()
    let streak = 1
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(ascending[i - 1])
      const curr = new Date(ascending[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        streak++
      } else {
        longestStreak = Math.max(longestStreak, streak)
        streak = 1
      }
    }
    longestStreak = Math.max(longestStreak, streak)
  }

  // Room breakdown — study time per room
  const roomSessions = await prisma.timerSession.findMany({
    where: { profileId: profile.id },
    include: {
      timer: {
        include: {
          room: { select: { name: true } },
        },
      },
    },
  })

  const roomMap = new Map<string, number>()
  roomSessions.forEach(s => {
    const roomName = s.timer?.room?.name || 'Personal'
    roomMap.set(roomName, (roomMap.get(roomName) ?? 0) + s.duration)
  })

  const roomBreakdown: RoomStudyData[] = Array.from(roomMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([roomName, seconds], i) => ({
      roomName,
      seconds,
      color: ROOM_COLORS[i % ROOM_COLORS.length],
    }))

  return {
    todaySeconds,
    totalSeconds,
    totalSessions,
    averageSessionSeconds,
    currentStreak,
    longestStreak,
    dailyLimit: MAX_DAILY_SECONDS,
    weeklyData,
    roomBreakdown,
  }
}
