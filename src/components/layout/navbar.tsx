'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Palette, Timer, BarChart3, Map, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccent } from '@/components/providers/accent-provider'
import { signOut } from '@/actions/auth'
import { cn } from '@/lib/utils'
import { ProfileLink } from '@/components/profile/profile-link'
import { MinimalModeToggle } from './minimal-mode-toggle'

interface NavbarProps {
  username?: string
  userId?: string
}

export function Navbar({ username, userId }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const { accent, setAccent } = useAccent()
  const [showAccentMenu, setShowAccentMenu] = useState(false)

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 min-h-14 flex flex-wrap items-center justify-between gap-y-1 py-1">
        <div className="flex min-w-0 items-center gap-1 sm:gap-4">
          <Link href="/dashboard" aria-label="Re-Focus dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined} className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg group">
            <Timer className="h-5 w-5 text-accent-primary" />
            <span className="font-handwriting font-bold text-2xl tracking-tight hidden lg:inline-block group-hover:text-accent-primary transition-colors">
              Re-Focus
            </span>
          </Link>

          {/* Analytics link */}
          <Link href="/discover" aria-label="Discover rooms" aria-current={pathname === '/discover' ? 'page' : undefined} className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-accent-primary aria-[current=page]:text-accent-primary">
            <Compass className="h-4 w-4" /><span className="hidden sm:inline">Discover</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            aria-label="Analytics"
            aria-current={pathname === "/dashboard/analytics" ? "page" : undefined}
            className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-accent-primary aria-[current=page]:bg-accent-primary/10 aria-[current=page]:text-accent-primary transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          {/* Roadmap link */}
          <Link
            href="/roadmap"
            aria-label="Roadmap"
            aria-current={pathname.startsWith("/roadmap") ? "page" : undefined}
            className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-accent-primary aria-[current=page]:bg-accent-primary/10 aria-[current=page]:text-accent-primary transition-colors"
          >
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </Link>
        </div>

        <div className="flex items-center gap-0 sm:gap-1">
          <MinimalModeToggle />
          {/* Accent theme selector */}
          <div className="relative minimal-optional">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAccentMenu(!showAccentMenu)}
              title="Change accent color"
              aria-label="Change accent color"
              aria-haspopup="dialog"
              aria-expanded={showAccentMenu}
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Dialog open={showAccentMenu} onOpenChange={setShowAccentMenu}>
              <DialogContent onClose={() => setShowAccentMenu(false)}>
                <DialogHeader><DialogTitle>Accent color</DialogTitle></DialogHeader>
                {[
                  { value: 'pink' as const, label: '✨ Pink', color: 'bg-pink-500' },
                  { value: 'dark' as const, label: '🌑 Dark', color: 'bg-slate-500' },
                  { value: 'neutral' as const, label: '🌈 Neutral', color: 'bg-indigo-500' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={accent === opt.value}
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
              </DialogContent>
            </Dialog>
          </div>

          {/* Dark/Light mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            aria-label="Toggle light or dark theme"
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User info */}
          {username && userId && (
            <ProfileLink userId={userId} username={username} avatar compact className="max-w-[160px] p-1 text-sm font-medium" />
          )}

          {/* Sign out */}
          {userId ? <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form> : <Link href="/login" className="px-2 py-2 text-sm hover:underline">Log in</Link>}
        </div>
      </div>
    </nav>
  )
}
