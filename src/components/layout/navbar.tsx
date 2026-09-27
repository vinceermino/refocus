'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Timer, BarChart3, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccent } from '@/components/providers/accent-provider'
import { signOut } from '@/actions/auth'
import { ProfileLink } from '@/components/profile/profile-link'
import { MinimalModeToggle } from './minimal-mode-toggle'
import { StyleSelector } from './style-selector'
import { InstallButton } from '@/components/providers/pwa-provider'

interface NavbarProps {
  username?: string
  userId?: string
}

export function Navbar({ username, userId }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const { accent } = useAccent()

  return (
    <nav aria-label="Main navigation" className="app-navbar sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 min-h-14 flex flex-wrap items-center justify-between gap-y-1 py-1">
        <div className="flex min-w-0 items-center gap-1 sm:gap-4">
          <Link href="/dashboard" aria-label="Re-Focus dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined} className="group flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg px-2 aria-[current=page]:bg-accent-primary/10">
            <Timer className="h-5 w-5 text-accent-primary" />
            <span className="font-handwriting font-bold text-2xl tracking-tight hidden lg:inline-block group-hover:text-accent-primary transition-opacity">
              Re-Focus
            </span>
          </Link>

          <Link href="/discover" title="Discover rooms" aria-label="Discover rooms" aria-current={pathname === '/discover' ? 'page' : undefined} className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-accent-primary aria-[current=page]:bg-accent-primary/10 aria-[current=page]:text-accent-primary transition-opacity">
            <Compass className="h-4 w-4" /><span className="minimal-optional hidden sm:inline">Discover</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            title="Analytics"
            aria-label="Analytics"
            aria-current={pathname === "/dashboard/analytics" ? "page" : undefined}
            className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-accent-primary aria-[current=page]:bg-accent-primary/10 aria-[current=page]:text-accent-primary transition-opacity"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="minimal-optional hidden sm:inline">Analytics</span>
          </Link>
        </div>

        <div className="flex items-center gap-0 sm:gap-1">
          <InstallButton />
          <MinimalModeToggle />
          <StyleSelector />

          {/* Dark/Light mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title={accent === 'pink' ? 'Toggle cream or blush paper' : 'Toggle theme'}
            aria-label={accent === 'pink' ? 'Toggle cream or blush paper' : 'Toggle light or dark theme'}
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
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
