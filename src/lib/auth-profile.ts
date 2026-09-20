import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export class AuthenticationError extends Error {}

export async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthenticationError('Not authenticated')
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new AuthenticationError('Profile not found')
  return profile
}
