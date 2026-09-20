import type { Prisma } from '@prisma/client'
import { DEFAULT_GOAL_MINUTES, MAX_DAILY_SECONDS, utcDay } from '@/lib/focus-goals'

export async function recordFocus(tx: Prisma.TransactionClient, profileId: string, seconds: number, now: Date, timerId?: string) {
  // Serialize personal and room saves so they cannot exceed the daily quota.
  await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profileId}::uuid FOR UPDATE`
  const day = utcDay(now)
  const daily = await tx.dailyStat.findUnique({ where: { profileId_day: { profileId, day } } })
  const duration = Math.max(0, Math.min(seconds, MAX_DAILY_SECONDS - (daily?.focusSeconds ?? 0)))
  if (!duration) return 0
  await tx.timerSession.create({ data: { profileId, timerId, duration, startedAt: new Date(now.getTime() - duration * 1000), endedAt: now, createdAt: now } })
  await tx.dailyStat.upsert({
    where: { profileId_day: { profileId, day } },
    create: { profileId, day, goalMinutes: DEFAULT_GOAL_MINUTES, focusSeconds: duration },
    update: { focusSeconds: { increment: duration } },
  })
  await tx.profile.update({ where: { id: profileId }, data: { totalStudyTime: { increment: duration } } })
  return duration
}
