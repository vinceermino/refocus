'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateRoomCode } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

export async function createRoom(formData: FormData) {
  const profile = await getAuthUser()
  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Room name is required' }

  const code = generateRoomCode()

  const room = await prisma.room.create({
    data: {
      name: name.trim(),
      code,
      ownerId: profile.id,
      members: {
        create: {
          profileId: profile.id,
          role: 'owner',
        },
      },
    },
  })

  revalidatePath('/dashboard')
  return { room }
}

export async function joinRoom(formData: FormData) {
  const profile = await getAuthUser()
  const code = (formData.get('code') as string)?.trim().toUpperCase()
  if (!code) return { error: 'Room code is required' }

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room) return { error: 'Room not found' }

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_profileId: { roomId: room.id, profileId: profile.id } },
  })
  if (existing) return { room } // Already a member

  await prisma.roomMember.create({
    data: { roomId: room.id, profileId: profile.id, role: 'member' },
  })

  revalidatePath('/dashboard')
  return { room }
}

export async function leaveRoom(roomId: string) {
  const profile = await getAuthUser()

  await prisma.roomMember.deleteMany({
    where: { roomId, profileId: profile.id },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getUserRooms() {
  const profile = await getAuthUser()

  const memberships = await prisma.roomMember.findMany({
    where: { profileId: profile.id },
    include: {
      room: {
        include: {
          _count: { select: { members: true } },
          timers: {
            where: { status: { in: ['running', 'paused'] } },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => m.room)
}

export async function getRoomByCode(code: string) {
  return prisma.room.findUnique({
    where: { code },
    include: {
      owner: { select: { id: true, username: true, } },
      members: {
        include: {
          profile: { select: { id: true, username: true, genderPref: true } },
        },
      },
      _count: { select: { members: true } },
    },
  })
}
