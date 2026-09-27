'use client'

import { useState } from 'react'
import { Play, Pause, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  isOwner: boolean
  mode: 'countdown' | 'stopwatch' | 'rest'
  duration: number
  loading?: boolean
  onStart: (duration: number, mode: 'countdown' | 'stopwatch' | 'rest') => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onModeChange: (mode: 'countdown' | 'stopwatch' | 'rest', duration?: number) => void
  onDurationChange: (duration: number) => void
}

const PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '50m', seconds: 50 * 60 },
  { label: '90m', seconds: 90 * 60 },
]

export function TimerControls({
  isRunning,
  isPaused,
  isOwner,
  mode,
  duration,
  loading = false,
  onStart,
  onPause,
  onResume,
  onStop,
  onModeChange,
  onDurationChange,
}: TimerControlsProps) {
  const [showStopDialog, setShowStopDialog] = useState(false)
  const isActive = isRunning || isPaused

  if (!isOwner) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        <MinimalModeText short="Owner or admin controls the timer.">Waiting for an owner or admin to control the timer...</MinimalModeText>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-6">
      {/* Mode toggle */}
      {!isActive && (
        <div role="group" aria-label="Timer mode" className="timer-modes flex max-w-full flex-wrap justify-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'countdown'}
            disabled={loading}
            onClick={() => onModeChange('countdown')}
            className={cn(
              'px-3 sm:px-4 font-medium',
              mode === 'countdown'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Focus
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'rest'}
            disabled={loading}
            onClick={() => onModeChange('rest')}
            className={cn(
              'px-3 sm:px-4 font-medium',
              mode === 'rest'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rest
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'stopwatch'}
            disabled={loading}
            onClick={() => onModeChange('stopwatch')}
            className={cn(
              'px-3 sm:px-4 font-medium',
              mode === 'stopwatch'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Stopwatch
          </Button>
        </div>
      )}

      {/* Duration presets (countdown only) */}
      {!isActive && (mode === 'countdown' || mode === 'rest') && (
        <fieldset className="min-w-0 space-y-2 text-center">
          <legend className="mb-2 w-full text-sm font-medium text-muted-foreground">
            <MinimalModeText short="Duration (min)">{mode === 'rest' ? 'Rest Duration (minutes)' : 'Focus Duration (minutes)'}</MinimalModeText>
          </legend>
          <div className="timer-presets flex flex-wrap justify-center gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={duration === preset.seconds}
                aria-label={`${preset.seconds / 60} minutes`}
                disabled={loading}
                onClick={() => onDurationChange(preset.seconds)}
                className={cn(
                  'min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                  duration === preset.seconds
                    ? 'bg-accent-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Action buttons */}
      <div className="timer-actions flex flex-wrap items-center justify-center gap-3">
        {!isActive ? (
          <Button
            size="lg"
            onClick={() => onStart(mode === 'stopwatch' ? 0 : duration, mode)}
            className="gap-2 px-8"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {loading ? 'Starting...' : 'Start'}
          </Button>
        ) : (
          <>
            {isRunning ? (
              <Button size="lg" variant="secondary" onClick={onPause} className="gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Pause className="h-5 w-5" />}
                {loading ? 'Pausing...' : 'Pause'}
              </Button>
            ) : (
              <Button size="lg" onClick={onResume} className="gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {loading ? 'Resuming...' : 'Resume'}
              </Button>
            )}
            <Button size="lg" variant="destructive" onClick={() => setShowStopDialog(true)} className="gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Square className="h-5 w-5" />}
              {loading ? 'Stopping...' : 'Stop'}
            </Button>
          </>
        )}
      </div>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent onClose={() => setShowStopDialog(false)}>
          <DialogHeader>
            <DialogTitle>Stop Timer?</DialogTitle>
            <DialogDescription>
              <MinimalModeText short="End this session? Signed-in focus time is saved; rest is excluded.">
                Are you sure you want to stop the timer? This will end your current session. Signed-in focus sessions are recorded; rest sessions are not counted as study time.
              </MinimalModeText>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowStopDialog(false)
                onStop()
              }}
            >
              Stop Timer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
