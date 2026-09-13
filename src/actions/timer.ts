'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

export async function startTimer(roomId: string, duration: number, mode: 'countdown' | 'stopwatch' = 'countdown') {
  const profile = await getAuthProfile()
  const now = new Date()

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
      duration,
      startedAt: now,
      elapsed: 0,
    },
  })

  return { timer }
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

  const updatedTimer = await prisma.timer.update({
    where: { id: timerId },
    data: {
      status: 'stopped',
      endedAt: now,
      elapsed: totalElapsed,
    },
  })

  // Record the session for the user
  if (totalElapsed > 0) {
    await prisma.timerSession.create({
      data: {
        timerId: timer.id,
        profileId: profile.id,
        duration: totalElapsed,
        startedAt: timer.createdAt,
        endedAt: now,
      },
    })

    // Update total study time
    await prisma.profile.update({
      where: { id: profile.id },
      data: { totalStudyTime: { increment: totalElapsed } },
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
