import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { canManageRoom } from '@/lib/room-permissions'

export async function lockRoom(tx: Prisma.TransactionClient, roomId: string) {
  // All room mutations acquire this lock before checking permissions. This also
  // serializes ownership transfers, joins and simultaneous timer controls.
  await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE`
}

export async function roomRole(roomId: string, profileId: string, db: Prisma.TransactionClient = prisma) {
  const room = await db.room.findUnique({ where: { id: roomId } })
  if (!room) return null
  const member = await db.roomMember.findUnique({ where: { roomId_profileId: { roomId, profileId } } })
  if (member?.status !== 'active') return null
  return room.ownerId === profileId ? 'owner' : member.role
}

export async function requireRoomRole(roomId: string, profileId: string, manage = false, db: Prisma.TransactionClient = prisma) {
  const role = await roomRole(roomId, profileId, db)
  if (!role || (manage && !canManageRoom(role))) throw new Error('You do not have permission to perform this room action.')
  return role
}
