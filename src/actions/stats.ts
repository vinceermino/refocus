'use server'

import { getAuthProfile } from '@/lib/auth-profile'
import { loadStudyStats } from '@/lib/study-stats'
import { prisma } from '@/lib/prisma'
import { utcDay, validGoal } from '@/lib/focus-goals'
import { revalidatePath } from 'next/cache'

export type StudyStats = Awaited<ReturnType<typeof loadStudyStats>>

export async function getStudyStats(): Promise<StudyStats> {
  const profile = await getAuthProfile()
  return loadStudyStats(profile.id)
}

export async function setDailyGoal(minutes: number) {
  const profile = await getAuthProfile()
  if (!validGoal(minutes)) return { error: 'Enter a whole number from 1 to 480 minutes.' }
  const day = utcDay()
  await prisma.dailyStat.upsert({
    where: { profileId_day: { profileId: profile.id, day } },
    create: { profileId: profile.id, day, goalMinutes: minutes },
    update: { goalMinutes: minutes },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/analytics')
  return { stats: await loadStudyStats(profile.id) }
}
