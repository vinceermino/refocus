import Link from 'next/link'
import { Timer, Users, Zap, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent-primary" />
            <span className="font-bold text-lg">Re-Focus</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Real-time study sessions
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Study Together,
            <br />
            <span className="text-accent-primary">Stay Focused</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Join shared study rooms with synchronized timers. See who&apos;s online, track your progress, and stay accountable with friends.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors shadow-lg shadow-accent-glow"
            >
              Start Studying
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <Timer className="h-8 w-8 text-accent-primary mb-3" />
              <h3 className="font-semibold mb-1">Synced Timers</h3>
              <p className="text-sm text-muted-foreground">Countdown or stopwatch mode, perfectly synced across all participants.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <Users className="h-8 w-8 text-accent-primary mb-3" />
              <h3 className="font-semibold mb-1">Study Rooms</h3>
              <p className="text-sm text-muted-foreground">Create rooms and invite friends with a simple 6-character code.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <Zap className="h-8 w-8 text-accent-primary mb-3" />
              <h3 className="font-semibold mb-1">Real-time</h3>
              <p className="text-sm text-muted-foreground">See who's online and track everyone's focus in real-time.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
