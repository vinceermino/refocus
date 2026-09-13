'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign up failed' }

  // Also get genderPref from formData
  const genderPref = (formData.get('genderPref') as string) || 'neutral'

  await prisma.profile.create({
    data: {
      userId: data.user.id,
      username,
      genderPref,
    },
  })

  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.profile.findUnique({ where: { userId: user.id } })
}

export async function updateGenderPref(genderPref: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await prisma.profile.update({
    where: { userId: user.id },
    data: { genderPref },
  })

  return { success: true }
}
