'use client'

import { useState } from 'react'
import { Play, Pause, Square, Timer, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  isOwner: boolean
  mode: 'countdown' | 'stopwatch'
  duration: number
  loading?: boolean
  onStart: (duration: number, mode: 'countdown' | 'stopwatch') => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onModeChange: (mode: 'countdown' | 'stopwatch', duration?: number) => void
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
        Waiting for the room owner to control the timer...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode toggle */}
      {!isActive && (
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => onModeChange('countdown', 25 * 60)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              mode === 'countdown'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Timer className="h-4 w-4" />
            Countdown
          </button>
          <button
            onClick={() => onModeChange('stopwatch', 0)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              mode === 'stopwatch'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="h-4 w-4" />
            Stopwatch
          </button>
        </div>
      )}

      {/* Duration presets (countdown only) */}
      {!isActive && mode === 'countdown' && (
        <div className="flex items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onDurationChange(preset.seconds)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                duration === preset.seconds
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!isActive ? (
          <Button
            size="lg"
            onClick={() => onStart(mode === 'countdown' ? duration : 0, mode)}
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
              Are you sure you want to stop the timer? This will end your current session and save your progress.
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
