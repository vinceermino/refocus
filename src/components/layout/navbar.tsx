'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Palette, Timer, BarChart3, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccent } from '@/components/providers/accent-provider'
import { signOut } from '@/actions/auth'
import { cn } from '@/lib/utils'

interface NavbarProps {
  username?: string
}

export function Navbar({ username }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { accent, setAccent } = useAccent()
  const [showAccentMenu, setShowAccentMenu] = useState(false)

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Timer className="h-5 w-5 text-accent-primary" />
            <span className="font-bold text-lg group-hover:text-accent-primary transition-colors">
              Re-Focus
            </span>
          </Link>

          {/* Analytics link */}
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-primary transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          {/* Roadmap link */}
          <Link
            href="/roadmap"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-primary transition-colors"
          >
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Accent theme selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAccentMenu(!showAccentMenu)}
              title="Change accent color"
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showAccentMenu && (
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[140px] z-50">
                {[
                  { value: 'pink' as const, label: '✨ Pink', color: 'bg-pink-500' },
                  { value: 'dark' as const, label: '🌑 Dark', color: 'bg-slate-500' },
                  { value: 'neutral' as const, label: '🌈 Neutral', color: 'bg-indigo-500' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAccent(opt.value); setShowAccentMenu(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      accent === opt.value
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span className={cn('h-3 w-3 rounded-full', opt.color)} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark/Light mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User info */}
          {username && (
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{username}</span>
          )}

          {/* Sign out */}
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
