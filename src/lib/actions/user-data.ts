import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loadStudyStats } from '@/lib/study-stats'

export async function getUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', status: 401 }
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) return { error: 'Profile not found', status: 404 }
  const memberships = await prisma.roomMember.findMany({
    where: { profileId: profile.id, status: 'active' },
    include: { room: { include: {
      _count: { select: { members: { where: { status: 'active' } } } },
      timers: { where: { status: { in: ['running', 'paused'] } }, take: 1, orderBy: { createdAt: 'desc' } },
    } } },
    orderBy: { joinedAt: 'desc' },
  })
  const stats = await loadStudyStats(profile.id)
  return { data: {
    profile: { id: profile.id, username: profile.username, genderPref: profile.genderPref, totalStudyTime: profile.totalStudyTime },
    rooms: memberships.map(m => m.room), stats,
  } }
}
