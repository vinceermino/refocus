import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getRoomByCode } from '@/actions/rooms'
import { getActiveTimer } from '@/actions/timer'
import { StudyRoom } from './study-room'

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

  const room = await getRoomByCode(code)
  if (!room) notFound()

  // Check if user is a member
  const isMember = room.members.some((m) => m.profile.id === profile.id)
  if (!isMember) {
    // Auto-join if public
    if (room.isPublic) {
      await prisma.roomMember.create({
        data: { roomId: room.id, profileId: profile.id, role: 'member' },
      })
    } else {
      notFound()
    }
  }

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
      }}
      currentUser={{
        id: profile.id,
        username: profile.username,
      }}
      isOwner={isOwner}
      initialTimer={timerState}
    />
  )
}
