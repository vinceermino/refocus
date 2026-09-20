'use server'

import { prisma } from '@/lib/prisma'
import { getAuthProfile } from '@/lib/auth-profile'
import { lockRoom, requireRoomRole } from '@/lib/room-access'
import { canManageRoom, memberActionError, type MemberAction } from '@/lib/room-permissions'
import { generateRoomCode } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

function refreshRoom(code: string) {
  revalidatePath(`/room/${code}`)
  revalidatePath('/dashboard')
  revalidatePath('/discover')
}

export async function createRoom(formData: FormData) {
  const profile = await getAuthProfile()
  const name = formData.get('name')
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) return { error: 'Enter a room name of 1–80 characters.' }
  const room = await prisma.room.create({ data: {
    name: name.trim(), code: generateRoomCode(), ownerId: profile.id,
    members: { create: { profileId: profile.id, role: 'owner' } },
  } })
  refreshRoom(room.code)
  return { room }
}

export async function joinRoom(formData: FormData) {
  const profile = await getAuthProfile()
  const code = formData.get('code')
  if (typeof code !== 'string' || !code.trim() || code.length > 32) return { error: 'A valid invitation code is required.' }
  const room = await prisma.room.findUnique({ where: { code: code.trim().toUpperCase() } })
  if (!room) return { error: 'Room not found' }
  // Possession of the invitation code/link permits joining private rooms.
  const result = await prisma.$transaction(async tx => {
    await lockRoom(tx, room.id)
    if (!await tx.room.findUnique({ where: { id: room.id } })) return { error: 'Room not found' }
    const existing = await tx.roomMember.findUnique({ where: { roomId_profileId: { roomId: room.id, profileId: profile.id } } })
    if (existing?.status === 'banned') return { error: 'You are banned from this room.' }
    await tx.roomMember.upsert({
      where: { roomId_profileId: { roomId: room.id, profileId: profile.id } },
      create: { roomId: room.id, profileId: profile.id },
      update: { status: 'active', ...(existing?.status !== 'active' && { role: 'member', joinedAt: new Date() }) },
    })
    return { room }
  })
  refreshRoom(room.code)
  return result
}

export async function joinPublicRoom(roomId: string) {
  const profile = await getAuthProfile()
  const result = await prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    const room = await tx.room.findUnique({ where: { id: roomId } })
    if (!room?.isPublic) return { error: 'This room is no longer public. Ask for an invitation.' }
    const existing = await tx.roomMember.findUnique({ where: { roomId_profileId: { roomId, profileId: profile.id } } })
    if (existing?.status === 'banned') return { error: 'You are banned from this room.' }
    await tx.roomMember.upsert({ where: { roomId_profileId: { roomId, profileId: profile.id } },
      create: { roomId, profileId: profile.id },
      update: { status: 'active', ...(existing?.status !== 'active' && { role: 'member', joinedAt: new Date() }) },
    })
    return { room }
  })
  if (result.room) refreshRoom(result.room.code)
  return result
}

export async function requestRoomAccess(roomId: string) {
  const profile = await getAuthProfile()
  return prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    const room = await tx.room.findUnique({ where: { id: roomId } })
    if (!room || room.isPublic) return { error: 'This room does not accept private join requests.' }
    const existing = await tx.roomMember.findUnique({ where: { roomId_profileId: { roomId, profileId: profile.id } } })
    if (existing && ['active', 'pending', 'banned'].includes(existing.status)) return { error: 'You have already joined, requested access, or are banned.' }
    await tx.roomMember.upsert({ where: { roomId_profileId: { roomId, profileId: profile.id } },
      create: { roomId, profileId: profile.id, status: 'pending' }, update: { status: 'pending', role: 'member' } })
    refreshRoom(room.code)
    return { success: true }
  })
}

export async function leaveRoom(roomId: string) {
  const profile = await getAuthProfile()
  return prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    const role = await requireRoomRole(roomId, profile.id, false, tx)
    if (role === 'owner') return { error: 'Transfer ownership before leaving the room.' }
    await tx.roomMember.update({ where: { roomId_profileId: { roomId, profileId: profile.id } }, data: { status: 'kicked', role: 'member', lastSeenAt: null } })
    revalidatePath('/dashboard')
    return { success: true }
  })
}

export async function getUserRooms() {
  const profile = await getAuthProfile()
  const memberships = await prisma.roomMember.findMany({ where: { profileId: profile.id, status: 'active' },
    include: { room: { include: { _count: { select: { members: { where: { status: 'active' } } } }, timers: { where: { status: { in: ['running', 'paused'] } }, take: 1, orderBy: { createdAt: 'desc' } } } } }, orderBy: { joinedAt: 'desc' } })
  return memberships.map(m => m.room)
}

export async function getRoomByCode(code: string) {
  const profile = await getAuthProfile()
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room) return null
  const role = await requireRoomRole(room.id, profile.id)
  return prisma.room.findUnique({ where: { id: room.id }, include: {
    members: { where: { status: { in: canManageRoom(role) ? ['active', 'pending', 'banned'] : ['active'] } },
      include: { profile: { select: { id: true, username: true, genderPref: true } } }, orderBy: { joinedAt: 'asc' } },
  } })
}

export async function updateRoomSettings(roomId: string, data: { name: string; isPublic: boolean; description?: string; tags?: string[]; focusDuration?: number; restDuration?: number }) {
  const profile = await getAuthProfile()
  if (!data || typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 80 || typeof data.isPublic !== 'boolean') return { error: 'A name of 1–80 characters and visibility are required.' }
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > 500)) return { error: 'Description must be at most 500 characters.' }
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.length > 8 || data.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 24))) return { error: 'Use up to 8 tags of 1–24 characters each.' }
  for (const [value, max] of [[data.focusDuration, 7200], [data.restDuration, 3600]]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 60 || value > max!)) return { error: 'Focus must be 1–120 minutes and rest 1–60 minutes.' }
  }
  const result = await prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    await requireRoomRole(roomId, profile.id, true, tx)
    const room = await tx.room.update({ where: { id: roomId }, data: {
      name: data.name.trim(), isPublic: data.isPublic, description: data.description?.trim(),
      tags: data.tags && [...new Set(data.tags.map(t => t.trim().toLowerCase()))],
      focusDuration: data.focusDuration, restDuration: data.restDuration,
    } })
    return { room, error: undefined }
  })
  refreshRoom(result.room.code)
  return result
}

export async function manageRoomMember(roomId: string, targetId: string, action: MemberAction) {
  const profile = await getAuthProfile()
  if (!['promote', 'demote', 'kick', 'ban', 'approve', 'reject', 'transfer', 'unban'].includes(action)) return { error: 'Invalid member action.' }
  const result = await prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    const role = await requireRoomRole(roomId, profile.id, true, tx)
    const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
    const target = await tx.roomMember.findUnique({ where: { roomId_profileId: { roomId, profileId: targetId } } })
    if (!target) return { error: 'Member not found.' }
    const error = memberActionError(role, room.ownerId === targetId ? 'owner' : target.role, targetId === profile.id, action)
    if (error) return { error }
    if (['approve', 'reject'].includes(action) ? target.status !== 'pending' : action === 'unban' ? target.status !== 'banned' : target.status !== 'active') return { error: 'This member’s status has changed. Refresh and try again.' }
    if (action === 'transfer') {
      await tx.room.update({ where: { id: roomId }, data: { ownerId: targetId } })
      await tx.roomMember.update({ where: { roomId_profileId: { roomId, profileId: profile.id } }, data: { role: 'admin' } })
    }
    await tx.roomMember.update({ where: { id: target.id }, data:
      action === 'promote' ? { role: 'admin' } : action === 'demote' ? { role: 'member' } : action === 'transfer' ? { role: 'owner' } :
      action === 'approve' ? { status: 'active', role: 'member', joinedAt: new Date() } :
      { status: action === 'ban' ? 'banned' : 'kicked', role: 'member', lastSeenAt: null },
    })
    return { success: true, code: room.code }
  })
  if (result.code) refreshRoom(result.code)
  return result
}

export async function deleteRoom(roomId: string) {
  const profile = await getAuthProfile()
  const result = await prisma.$transaction(async tx => {
    await lockRoom(tx, roomId)
    if (await requireRoomRole(roomId, profile.id, true, tx) !== 'owner') return { error: 'Only the owner can delete the room.' }
    const room = await tx.room.delete({ where: { id: roomId } })
    return { success: true, code: room.code }
  })
  if (result.code) refreshRoom(result.code)
  return result
}

export async function heartbeatRoom(roomId: string) {
  const profile = await getAuthProfile()
  const result = await prisma.roomMember.updateMany({ where: { roomId, profileId: profile.id, status: 'active' }, data: { lastSeenAt: new Date() } })
  return { success: result.count === 1 }
}
