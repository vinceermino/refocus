import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalTimer } from '@/components/timer/personal-timer'
import { MinimalModeToggle } from '@/components/layout/minimal-mode-toggle'

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
            <span className="font-handwriting font-bold text-2xl tracking-tight">Re-Focus</span>
          </div>
          <div className="flex items-center gap-3">
            <MinimalModeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-accent-primary transition-colors px-3 py-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-8 sm:py-16 gap-10 sm:gap-16">
        <h1 className="sr-only">Personal study timer</h1>
        <PersonalTimer />

        {/* About the App */}
        <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
          <h2 className="minimal-optional text-3xl font-bold text-accent-primary">
            Study Together, Grow Together
          </h2>
          <p className="minimal-optional text-lg text-muted-foreground leading-relaxed">
            Re-Focus is the perfect companion for student couples who want to stay motivated. 
            Use the personal timer for deep-focus solo sessions, or create private study rooms to record 
            and share your focused hours together. Support each other&apos;s academic goals, one hour at a time.
          </p>
          <div className="pt-4 flex justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-full bg-accent-primary text-primary-foreground font-semibold hover:bg-accent-primary/90 transition-all shadow-lg hover:shadow-accent-primary/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
