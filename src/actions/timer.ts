'use server'

import { prisma } from '@/lib/prisma'
import { getAuthProfile } from '@/lib/auth-profile'
import { lockRoom, requireRoomRole } from '@/lib/room-access'
import { MAX_DAILY_SECONDS, utcDay } from '@/lib/focus-goals'
import { recordFocus } from '@/lib/record-focus'

export async function getRemainingDailyTime() {
  const profile = await getAuthProfile()
  const day = await prisma.dailyStat.findUnique({ where: { profileId_day: { profileId: profile.id, day: utcDay() } } })
  const used = day?.focusSeconds ?? 0
  return { used, remaining: Math.max(0, MAX_DAILY_SECONDS - used), limit: MAX_DAILY_SECONDS }
}

export async function startTimer(roomId: string, duration: number, mode: 'countdown' | 'stopwatch' | 'rest' = 'countdown') {
  const profile = await getAuthProfile()
  if (!['countdown', 'stopwatch', 'rest'].includes(mode) || !Number.isInteger(duration) || duration < 0 || duration > MAX_DAILY_SECONDS || (mode !== 'stopwatch' && duration === 0)) return { error: 'Invalid timer duration or mode.' }
  return prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    await requireRoomRole(roomId, profile.id, true, tx)
    if (await tx.timer.findFirst({ where: { roomId, status: { in: ['running', 'paused'] } } })) return { error: 'Stop the current session before starting another.' }
    const daily = await tx.dailyStat.findUnique({ where: { profileId_day: { profileId: profile.id, day: utcDay() } } })
    const remaining = Math.max(0, MAX_DAILY_SECONDS - (daily?.focusSeconds ?? 0))
    if (mode !== 'rest' && !remaining) return { error: 'Daily 8-hour study limit reached.' }
    const timer = await tx.timer.create({ data: { roomId, userId: profile.id, mode, status: 'running', duration: mode === 'countdown' ? Math.min(duration, remaining) : mode === 'stopwatch' ? remaining : duration, startedAt: new Date() } })
    return { timer, dailyRemaining: remaining }
  })
}

async function changeTimer(timerId: string, action: 'pause' | 'resume' | 'stop') {
  const profile = await getAuthProfile()
  const found = await prisma.timer.findUnique({ where: { id: timerId } })
  if (!found) return { error: 'Timer not found.' }
  return prisma.$transaction(async tx => {
    await lockRoom(tx, found.roomId)
    await requireRoomRole(found.roomId, profile.id, true, tx)
    const timer = await tx.timer.findUnique({ where: { id: timerId } })
    if (!timer) return { error: 'Timer not found.' }
    if (timer.status === 'stopped') return action === 'stop' ? { timer } : { error: 'Timer is stopped.' }
    if ((action === 'pause' && timer.status !== 'running') || (action === 'resume' && timer.status !== 'paused')) return { error: 'Timer state changed. Try again.' }
    const now = new Date()
    let elapsed = timer.elapsed + (timer.status === 'running' && timer.startedAt ? Math.max(0, Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)) : 0)
    elapsed = Math.min(elapsed, timer.mode === 'stopwatch' ? MAX_DAILY_SECONDS : timer.duration)
    if (action === 'stop' && timer.mode !== 'rest' && elapsed > 0) {
      // Credit the session's starter, even when another admin stops it.
      await recordFocus(tx, timer.userId, elapsed, now, timer.id)
    }
    const updated = await tx.timer.update({ where: { id: timerId }, data: {
      status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'stopped',
      elapsed, startedAt: action === 'resume' ? now : timer.startedAt,
      pausedAt: action === 'pause' ? now : null, endedAt: action === 'stop' ? now : null,
    } })
    return { timer: updated }
  })
}

export async function pauseTimer(timerId: string) { return changeTimer(timerId, 'pause') }
export async function resumeTimer(timerId: string) { return changeTimer(timerId, 'resume') }
export async function stopTimer(timerId: string) { return changeTimer(timerId, 'stop') }

export async function getActiveTimer(roomId: string) {
  const profile = await getAuthProfile()
  await requireRoomRole(roomId, profile.id)
  return prisma.timer.findFirst({ where: { roomId, status: { in: ['running', 'paused'] } }, orderBy: { createdAt: 'desc' } })
}

export async function logPersonalSession(duration: number) {
  const profile = await getAuthProfile()
  if (!Number.isSafeInteger(duration) || duration <= 0) return { error: 'Duration must be a positive whole number of seconds.' }
  const recorded = await prisma.$transaction(tx => recordFocus(tx, profile.id, duration, new Date()))
  return { success: true, duration: recorded }
}
