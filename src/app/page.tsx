import Link from 'next/link'
import { Heart, Coffee, Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="max-w-2xl mx-auto w-full animate-slide-up">

          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-accent-glow rounded-3xl p-8 sm:p-12 text-center space-y-8 relative overflow-hidden">

            {/* Cute top badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary-soft text-accent-primary text-sm font-medium border border-accent-primary/20">
              <Sparkles className="h-4 w-4" />
              <span>Our private study space</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                Welcome to our <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-pink-500">
                  Study Space
                </span>
              </h1>


            </div>


            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-all shadow-lg shadow-accent-glow hover:scale-105 active:scale-95"
              >
                Enter Our Room
                <Heart className="h-5 w-5 group-hover:fill-white transition-all" />
              </Link>
            </div>
          </div>



        </div>
      </main>
    </div>
  )
}
