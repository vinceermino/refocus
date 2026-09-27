import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loadStudyStats } from '@/lib/study-stats'

export async function getUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', status: 401 }
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, username: true, genderPref: true, totalStudyTime: true },
  })
  if (!profile) return { error: 'Profile not found', status: 404 }
  const [memberships, stats] = await Promise.all([
    prisma.roomMember.findMany({
      where: { profileId: profile.id, status: 'active' },
      select: { room: { select: {
        id: true, name: true, code: true,
        _count: { select: { members: { where: { status: 'active' } } } },
        timers: {
          where: { status: { in: ['running', 'paused'] } },
          select: { status: true, mode: true },
          take: 1, orderBy: { createdAt: 'desc' },
        },
      } } },
      orderBy: { joinedAt: 'desc' },
    }),
    loadStudyStats(profile.id),
  ])
  return { data: {
    profile,
    rooms: memberships.map(m => m.room), stats,
  } }
}
