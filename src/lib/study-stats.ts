import { prisma } from '@/lib/prisma'
import { calculateStreaks, DEFAULT_GOAL_MINUTES, MAX_DAILY_SECONDS, utcDay } from '@/lib/focus-goals'

const ROOM_COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6']

export async function loadStudyStats(profileId: string) {
  const today = utcDay()
  const [days, total, rooms] = await Promise.all([
    prisma.dailyStat.findMany({
      where: { profileId, day: { lte: today } },
      select: { day: true, focusSeconds: true, goalMinutes: true },
      orderBy: { day: 'asc' },
    }),
    prisma.timerSession.aggregate({ where: { profileId }, _sum: { duration: true }, _count: true, _avg: { duration: true } }),
    // Aggregate in Postgres so a growing session history does not have to be
    // transferred to the application. Keep the existing grouping by room name;
    // personal sessions and deleted rooms both belong to Personal.
    prisma.$queryRaw<{ roomName: string; seconds: number }[]>`
      SELECT COALESCE(r.name, 'Personal') AS "roomName",
        SUM(s.duration)::double precision AS seconds
      FROM timer_sessions s
      LEFT JOIN timers t ON t.id = s.timer_id
      LEFT JOIN rooms r ON r.id = t.room_id
      WHERE s.profile_id = ${profileId}::uuid
      GROUP BY COALESCE(r.name, 'Personal')
      ORDER BY seconds DESC, "roomName" ASC
      LIMIT 10
    `,
  ])
  const daysByTime = new Map(days.map(day => [day.day.getTime(), day]))
  const todayStats = daysByTime.get(today.getTime())
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getTime() - (6 - i) * 86_400_000)
    return {
      date: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      fullDate: day.toISOString().slice(0, 10),
      seconds: daysByTime.get(day.getTime())?.focusSeconds ?? 0,
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
    roomBreakdown: rooms.map((room, i) => ({ ...room, color: ROOM_COLORS[i] })),
  }
}
