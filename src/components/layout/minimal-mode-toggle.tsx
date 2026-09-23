'use client'

import { Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMinimalMode } from '@/components/providers/minimal-mode-provider'

export function MinimalModeToggle() {
  const { minimal, toggle } = useMinimalMode()
  return <Button variant="ghost" size="icon" title="Minimal mode" aria-label="Minimal mode" aria-pressed={minimal} onClick={toggle}
    className="shrink-0 border border-transparent aria-pressed:border-border aria-pressed:bg-muted aria-pressed:text-accent-primary">
    <Minimize2 className="h-4 w-4" aria-hidden="true" />
  </Button>
}
