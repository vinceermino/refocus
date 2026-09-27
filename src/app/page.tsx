import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalTimer } from '@/components/timer/personal-timer'
import { MinimalModeToggle } from '@/components/layout/minimal-mode-toggle'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'
import { StyleSelector } from '@/components/layout/style-selector'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="landing-shell relative flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="app-navbar border-b border-border/50 bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-primary">
            <Heart className="h-5 w-5 fill-accent-primary" />
            <span className="font-handwriting font-bold text-2xl tracking-tight">Re-Focus</span>
          </div>
          <div className="flex items-center gap-3">
            <MinimalModeToggle />
            <StyleSelector />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-accent-primary transition-colors px-3 py-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1} className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 sm:py-12 gap-8 sm:gap-12">
        <h1 className="sr-only">Personal study timer</h1>
        <div className="she-only she-intro">
          <p className="she-eyebrow">A moment for yourself</p>
          <h2>Let your focus bloom.</h2>
          <p>Settle in. Take a breath. One thing at a time.</p>
        </div>
        <div className="he-only he-intro">
          <p className="he-eyebrow">A practice in stillness</p>
          <h2>Find your quiet focus.</h2>
          <p>Clear a little space. Give one thing your attention.</p>
        </div>
        <PersonalTimer />

        {/* About the App */}
        <div className="mx-auto max-w-lg space-y-3 text-center">
          <h2 className="minimal-optional text-xl font-semibold">
            Make time to focus
          </h2>
          <p className="minimal-optional text-sm leading-relaxed text-muted-foreground">
            Start a focus session on your own. Create an account to save your study time,
            set a daily goal, and study together in shared rooms.
          </p>
          <div className="pt-4 flex justify-center">
            <Link
              href="/signup"
              className="primary-link rounded-lg bg-accent-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-primary/90"
            >
              <MinimalModeText short="Sign up">Get Started for Free</MinimalModeText>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
