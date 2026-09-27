import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

// Two fixed, clipped semicircles. Only rotation changes between timer ticks.
export function ProgressRing({ progress, color, className }: { progress: number; color: string; className?: string }) {
  const value = Math.max(0, Math.min(1, progress))
  return <div aria-hidden="true" className={cn('progress-ring', className)} style={{ '--progress-color': color } as CSSProperties}>
    <div className="progress-ring-track" />
    <div className="progress-half progress-half-right"><div className="progress-arc" style={{ transform: `rotate(${Math.min(value * 360, 180)}deg)` }} /></div>
    <div className="progress-half progress-half-left"><div className="progress-arc" style={{ transform: `rotate(${Math.max(0, value * 360 - 180)}deg)` }} /></div>
    {value > 0 && <><div className="progress-cap" /><div className="progress-cap-end" style={{ transform: `rotate(${value * 360}deg)` }}><div className="progress-cap" /></div></>}
  </div>
}
