import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/layout/navbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={profile?.username} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
