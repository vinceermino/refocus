'use client'

import { memo } from 'react'
import { Minimize } from 'lucide-react'

export const FullscreenChrome = memo(function FullscreenChrome({ active, announcement, onExit }: { active: boolean; announcement: string; onExit: () => void }) {
  return <>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    {active && <>
      <button type="button" onClick={onExit} className="fullscreen-exit absolute right-4 top-4 z-20 flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground" aria-label="Exit timer fullscreen"><Minimize className="h-4 w-4" />Exit</button>
      <div aria-hidden="true" className="fullscreen-decoration"><i /><i /><i /><i /><i /></div>
    </>}
  </>
})
