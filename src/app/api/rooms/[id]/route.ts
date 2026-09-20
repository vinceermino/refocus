import { NextResponse } from 'next/server'
import { unstable_rethrow } from 'next/navigation'
import { AuthenticationError, getAuthProfile } from '@/lib/auth-profile'
import { prisma } from '@/lib/prisma'
import { roomRole } from '@/lib/room-access'
import { canManageRoom } from '@/lib/room-permissions'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getAuthProfile()
    const { id } = await params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid room ID.' }, { status: 400 })
    const role = await roomRole(id, profile.id)
    if (!role) return NextResponse.json({ error: 'Room access ended.' }, { status: 403 })
    const room = await prisma.room.findUnique({ where: { id }, include: {
      members: { where: { status: { in: canManageRoom(role) ? ['active', 'pending', 'banned'] : ['active'] } }, include: { profile: { select: { username: true } } }, orderBy: { joinedAt: 'asc' } },
      timers: { orderBy: { createdAt: 'desc' }, take: 1 },
    } })
    if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
    return NextResponse.json({
      role, room: { id: room.id, name: room.name, code: room.code, ownerId: room.ownerId, isPublic: room.isPublic, description: room.description, tags: room.tags, focusDuration: room.focusDuration, restDuration: room.restDuration },
      members: room.members.map(m => ({ id: m.profileId, username: m.profile.username, role: m.role, status: m.status, lastSeenAt: m.lastSeenAt })),
      timer: room.timers[0] ?? null,
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    unstable_rethrow(error)
    return NextResponse.json({ error: 'Unable to load room.' }, { status: error instanceof AuthenticationError ? 401 : 500 })
  }
}
