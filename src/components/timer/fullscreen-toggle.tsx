'use client'

import { memo } from 'react'

export const FullscreenToggle = memo(function FullscreenToggle({ enabled, onChange, supported }: { enabled: boolean; onChange: (value: boolean) => void; supported: boolean }) {
  return <label className="fullscreen-preference flex min-h-10 items-center justify-center gap-2 text-xs text-muted-foreground">
    <input type="checkbox" checked={enabled} onChange={event => onChange(event.target.checked)} disabled={!supported} className="h-4 w-4 accent-accent-primary" />
    <span>Fullscreen on start{!supported && <span className="block text-[11px]">Unavailable in this browser</span>}</span>
  </label>
})
