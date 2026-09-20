import { prisma } from '@/lib/prisma'
import { calculateStreaks, DEFAULT_GOAL_MINUTES, MAX_DAILY_SECONDS, utcDay } from '@/lib/focus-goals'

const ROOM_COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6']

export async function loadStudyStats(profileId: string) {
  const today = utcDay()
  const days = await prisma.dailyStat.findMany({ where: { profileId, day: { lte: today } }, orderBy: { day: 'asc' } })
  const todayStats = days.find(d => d.day.getTime() === today.getTime())
  const total = await prisma.timerSession.aggregate({ where: { profileId }, _sum: { duration: true }, _count: true, _avg: { duration: true } })
  const sessions = await prisma.timerSession.findMany({
    where: { profileId },
    select: { duration: true, timer: { select: { room: { select: { name: true } } } } },
  })
  const roomMap = new Map<string, number>()
  for (const session of sessions) {
    const name = session.timer?.room.name ?? 'Personal'
    roomMap.set(name, (roomMap.get(name) ?? 0) + session.duration)
  }
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getTime() - (6 - i) * 86_400_000)
    return {
      date: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      fullDate: day.toISOString().slice(0, 10),
      seconds: days.find(d => d.day.getTime() === day.getTime())?.focusSeconds ?? 0,
    }
  })
  return {
    todaySeconds: todayStats?.focusSeconds ?? 0,
    goalMinutes: todayStats?.goalMinutes ?? DEFAULT_GOAL_MINUTES,
    today: today.toISOString().slice(0, 10),
    totalSeconds: total._sum.duration ?? 0,
    totalSessions: total._count,
    averageSessionSeconds: Math.round(total._avg.duration ?? 0),
    ...calculateStreaks(days, today),
    dailyLimit: MAX_DAILY_SECONDS,
    weeklyData,
    roomBreakdown: Array.from(roomMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([roomName, seconds], i) => ({ roomName, seconds, color: ROOM_COLORS[i] })),
  }
}
