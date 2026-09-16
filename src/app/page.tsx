import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalTimer } from '@/components/timer/personal-timer'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-background to-accent-primary-soft/30">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-primary">
            <Heart className="h-5 w-5 fill-accent-primary" />
            <span className="font-bold text-lg tracking-tight">Re-Focus</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-accent-primary transition-colors px-3 py-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with Personal Timer */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10 py-12">
        <PersonalTimer />
      </main>
    </div>
  )
}
