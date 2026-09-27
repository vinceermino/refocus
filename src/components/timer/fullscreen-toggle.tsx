'use client'

import { memo } from 'react'

export const FullscreenToggle = memo(function FullscreenToggle({ enabled, fullscreen, active, onChange, supported }: { enabled: boolean; fullscreen: boolean; active: boolean; onChange: (value: boolean) => void; supported: boolean }) {
  const checked = active ? fullscreen : enabled
  const label = active ? 'Fullscreen' : 'Fullscreen on start'
  return <label className="fullscreen-preference flex min-h-11 cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground">
    <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)} disabled={!supported} className="peer sr-only" />
    <span aria-hidden="true" className="relative h-6 w-10 shrink-0 rounded-full border border-border bg-muted peer-checked:bg-accent-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-primary peer-disabled:opacity-50">
      <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </span>
    <span>{label}{!supported && <span className="block text-[11px]">Unavailable in this browser</span>}</span>
    <span aria-hidden="true" className="w-5 text-left">{checked ? 'On' : 'Off'}</span>
  </label>
})
