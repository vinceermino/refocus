'use client'

import { useState, useTransition } from 'react'
import { Pencil, Flame } from 'lucide-react'
import { useUserData } from '@/components/providers/user-data-provider'
import { setDailyGoal } from '@/actions/stats'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTime } from '@/lib/utils'

export function DailyGoal() {
  const { stats, applyStats } = useUserData()
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState('120')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (!stats) return null
  const percent = Math.min(100, stats.todaySeconds / (stats.goalMinutes * 60) * 100)
  return <section className="w-full rounded-xl border border-border bg-card p-4" aria-label="Daily focus goal">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">Today’s focus goal</h2>
      <Button variant="ghost" size="sm" aria-label="Edit daily focus goal" onClick={() => { setMinutes(String(stats.goalMinutes)); setError(''); setOpen(true) }}><Pencil className="h-3 w-3" />Edit</Button>
    </div>
    <div className="my-2 flex justify-between text-xs text-muted-foreground"><span>{formatTime(stats.todaySeconds)} / {formatTime(stats.goalMinutes * 60)}</span><span>{Math.round(percent)}%</span></div>
    <div role="progressbar" aria-label="Daily focus progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-accent-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span title="Consecutive days meeting your focus goal" tabIndex={0} className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}</span>
      <span>{percent >= 100 ? 'Goal achieved!' : 'Saved focus time · UTC day'}</span>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onClose={() => setOpen(false)}>
      <DialogHeader><DialogTitle>Edit today’s focus goal</DialogTitle><DialogDescription>Choose 1–480 minutes for today (UTC). Tomorrow starts with a 120-minute goal. The study limit remains 8 hours.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault()
        startTransition(async () => {
          try {
            const result = await setDailyGoal(Number(minutes))
            if (result.error) { setError(result.error); return }
            if (result.stats) applyStats(result.stats)
            setOpen(false)
          } catch { setError('Unable to save. Please try again.') }
        })
      }}>
        <label htmlFor="goal-minutes" className="text-sm font-medium">Focus goal (minutes)</label>
        <Input id="goal-minutes" type="number" min={1} max={480} step={1} required value={minutes} onChange={e => setMinutes(e.target.value)} disabled={pending} />
        {error && <p role="alert" className="text-sm text-timer-danger">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save goal'}</Button></div>
      </form>
    </DialogContent></Dialog>
  </section>
}
