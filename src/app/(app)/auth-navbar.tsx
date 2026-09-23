'use client'

import { Navbar } from '@/components/layout/navbar'
import { useUserData } from '@/components/providers/user-data-provider'

export function AuthNavbar() {
  const { profile } = useUserData()
  return <Navbar username={profile?.username} userId={profile?.id} />
}
