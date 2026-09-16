'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const MAX_DAILY_SECONDS = 8 * 60 * 60 // 8 hours = 28,800 seconds

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

/**
 * Get total study time recorded in TimerSessions for a profile today (UTC-based day).
 */
async function getDailyStudyTime(profileId: string): Promise<number> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const result = await prisma.timerSession.aggregate({
    where: {
      profileId,
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    _sum: { duration: true },
  })

  return result._sum.duration ?? 0
}

/**
 * Get how many seconds remain in today's 8-hour study budget.
 */
export async function getRemainingDailyTime(): Promise<{ remaining: number; used: number; limit: number }> {
  const profile = await getAuthProfile()
  const used = await getDailyStudyTime(profile.id)
  return {
    remaining: Math.max(0, MAX_DAILY_SECONDS - used),
    used,
    limit: MAX_DAILY_SECONDS,
  }
}

export async function startTimer(roomId: string, duration: number, mode: 'countdown' | 'stopwatch' = 'countdown') {
  const profile = await getAuthProfile()
  const now = new Date()

  // Check daily limit
  const dailyUsed = await getDailyStudyTime(profile.id)
  const remaining = MAX_DAILY_SECONDS - dailyUsed
  if (remaining <= 0) {
    return { error: 'Daily 8-hour study limit reached. Take a break and come back tomorrow!' }
  }

  // For countdown, cap the duration to remaining daily time
  const effectiveDuration = mode === 'countdown' ? Math.min(duration, remaining) : duration

  // Stop any existing running timer in this room
  await prisma.timer.updateMany({
    where: { roomId, status: { in: ['running', 'paused'] } },
    data: { status: 'stopped', endedAt: now },
  })

  const timer = await prisma.timer.create({
    data: {
      roomId,
      userId: profile.id,
      mode,
      status: 'running',
      duration: effectiveDuration,
      startedAt: now,
      elapsed: 0,
    },
  })

  return { timer, dailyRemaining: remaining }
}

export async function pauseTimer(timerId: string) {
  const timer = await prisma.timer.findUnique({ where: { id: timerId } })
  if (!timer || timer.status !== 'running') return { error: 'Timer is not running' }

  const now = new Date()
  const additionalElapsed = timer.startedAt
    ? Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
    : 0

  const updatedTimer = await prisma.timer.update({
    where: { id: timerId },
    data: {
      status: 'paused',
      pausedAt: now,
      elapsed: timer.elapsed + additionalElapsed,
    },
  })

  return { timer: updatedTimer }
}

export async function resumeTimer(timerId: string) {
  const timer = await prisma.timer.findUnique({ where: { id: timerId } })
  if (!timer || timer.status !== 'paused') return { error: 'Timer is not paused' }

  const now = new Date()

  const updatedTimer = await prisma.timer.update({
    where: { id: timerId },
    data: {
      status: 'running',
      startedAt: now,
      pausedAt: null,
    },
  })

  return { timer: updatedTimer }
}

export async function stopTimer(timerId: string) {
  const profile = await getAuthProfile()
  const timer = await prisma.timer.findUnique({ where: { id: timerId } })
  if (!timer) return { error: 'Timer not found' }

  const now = new Date()
  let totalElapsed = timer.elapsed

  if (timer.status === 'running' && timer.startedAt) {
    totalElapsed += Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
  }

  // Cap to daily remaining budget
  const dailyUsed = await getDailyStudyTime(profile.id)
  const dailyRemaining = Math.max(0, MAX_DAILY_SECONDS - dailyUsed)
  const cappedElapsed = Math.min(totalElapsed, dailyRemaining)

  const updatedTimer = await prisma.timer.update({
    where: { id: timerId },
    data: {
      status: 'stopped',
      endedAt: now,
      elapsed: cappedElapsed,
    },
  })

  // Record the session for the user
  if (cappedElapsed > 0) {
    await prisma.timerSession.create({
      data: {
        timerId: timer.id,
        profileId: profile.id,
        duration: cappedElapsed,
        startedAt: timer.createdAt,
        endedAt: now,
      },
    })

    // Update total study time
    await prisma.profile.update({
      where: { id: profile.id },
      data: { totalStudyTime: { increment: cappedElapsed } },
    })
  }

  revalidatePath(`/room`)
  return { timer: updatedTimer }
}

export async function getActiveTimer(roomId: string) {
  return prisma.timer.findFirst({
    where: {
      roomId,
      status: { in: ['running', 'paused'] },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function logPersonalSession(duration: number) {
  const profile = await getAuthProfile()
  const now = new Date()

  // Cap to daily remaining budget
  const dailyUsed = await getDailyStudyTime(profile.id)
  const dailyRemaining = Math.max(0, MAX_DAILY_SECONDS - dailyUsed)
  const cappedElapsed = Math.min(duration, dailyRemaining)

  if (cappedElapsed > 0) {
    const startedAt = new Date(now.getTime() - cappedElapsed * 1000)
    await prisma.timerSession.create({
      data: {
        profileId: profile.id,
        duration: cappedElapsed,
        startedAt,
        endedAt: now,
      },
    })

    // Update total study time
    await prisma.profile.update({
      where: { id: profile.id },
      data: { totalStudyTime: { increment: cappedElapsed } },
    })
  }
  return { success: true, duration: cappedElapsed }
}
