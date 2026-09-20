import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getRoomByCode } from '@/actions/rooms'
import { getActiveTimer } from '@/actions/timer'
import { StudyRoom } from './study-room'
import { RoomEntry } from '@/components/room/room-entry'

interface RoomContentProps {
  paramsPromise: Promise<{ code: string }>
}

export async function RoomContent({ paramsPromise }: RoomContentProps) {
  const { code } = await paramsPromise
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/login')

  const invitation = await prisma.room.findUnique({ where: { code: code.toUpperCase() }, select: { id: true, code: true, name: true, isPublic: true } })
  if (!invitation) notFound()
  const membership = await prisma.roomMember.findUnique({ where: { roomId_profileId: { roomId: invitation.id, profileId: profile.id } } })
  if (membership?.status === 'banned') notFound()
  if (membership?.status !== 'active') return <RoomEntry room={invitation} />
  const room = await getRoomByCode(invitation.code)
  if (!room) notFound()

  const activeTimer = await getActiveTimer(room.id)
  const isOwner = room.ownerId === profile.id

  const timerState = activeTimer
    ? {
      id: activeTimer.id,
      mode: activeTimer.mode as 'countdown' | 'stopwatch',
      status: activeTimer.status as 'running' | 'paused' | 'stopped',
      duration: activeTimer.duration,
      startedAt: activeTimer.startedAt?.toISOString() ?? null,
      elapsed: activeTimer.elapsed,
    }
    : null

  return (
    <StudyRoom
      room={{
        id: room.id,
        name: room.name,
        code: room.code,
        ownerId: room.ownerId,
        isPublic: room.isPublic,
        description: room.description,
        tags: room.tags,
        focusDuration: room.focusDuration,
        restDuration: room.restDuration,
      }}
      currentUser={{
        id: profile.id,
        username: profile.username,
      }}
      role={isOwner ? 'owner' : membership.role}
      members={room.members.map(m => ({ id: m.profileId, username: m.profile.username, role: m.role, status: m.status, lastSeenAt: m.lastSeenAt?.toISOString() ?? null }))}
      initialTimer={timerState}
    />
  )
}
