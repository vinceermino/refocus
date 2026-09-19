'use client'

import { useCallback, useEffect, useState, useTransition, useRef } from 'react'
import { toast } from 'sonner'
import { Copy, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { RoomSettingsModal } from '@/components/room/room-settings-modal'
import { TimerDisplay } from '@/components/timer/timer-display'
import { TimerControls } from '@/components/timer/timer-controls'
import { ParticipantList } from '@/components/timer/participant-list'
import { useLocalTimer } from '@/hooks/use-local-timer'
import { useRealtimeTimer } from '@/hooks/use-realtime-timer'
import { usePresence } from '@/hooks/use-presence'
import { useAlarm } from '@/hooks/use-alarm'
import { startTimer, pauseTimer, resumeTimer, stopTimer, getRemainingDailyTime } from '@/actions/timer'
import { Button } from '@/components/ui/button'

interface StudyRoomProps {
  room: {
    id: string
    name: string
    code: string
    ownerId: string
    isPublic: boolean
    focusDuration: number
    restDuration: number
  }
  currentUser: {
    id: string
    username: string
  }
  isOwner: boolean
  initialTimer: {
    id: string
    mode: 'countdown' | 'stopwatch' | 'rest'
    status: 'running' | 'paused' | 'stopped'
    duration: number
    startedAt: string | null
    elapsed: number
  } | null
}

export function StudyRoom({ room, currentUser, isOwner, initialTimer }: StudyRoomProps) {
  const { timerState, setTimerState, broadcastTimerUpdate } = useRealtimeTimer(room.id, initialTimer)
  const { onlineUsers } = usePresence(room.id, currentUser)
  const { playAlarm, stopAlarm } = useAlarm()
  const [isPending, startTransition] = useTransition()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Daily time tracking
  const [dailyRemaining, setDailyRemaining] = useState<number | undefined>(undefined)
  const [dailyUsed, setDailyUsed] = useState<number | undefined>(undefined)
  const hasPlayedAlarmRef = useRef(false)

  const timerOutput = useLocalTimer(timerState, dailyRemaining)

  // Fetch daily remaining time on mount and after stop
  const refreshDailyTime = useCallback(async () => {
    try {
      const result = await getRemainingDailyTime()
      setDailyRemaining(result.remaining)
      setDailyUsed(result.used)
    } catch {
      // Fail silently — daily quota is a nice-to-have
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(() => { void refreshDailyTime() }, 0)
    return () => window.clearTimeout(request)
  }, [refreshDailyTime])

  // Play alarm when timer completes
  useEffect(() => {
    if (timerOutput.isComplete && !hasPlayedAlarmRef.current) {
      hasPlayedAlarmRef.current = true
      playAlarm()

      if (timerState.mode === 'countdown') {
        toast.success('⏰ Timer complete! Great focus session!')
      } else {
        toast.warning('⏰ Daily 8-hour study limit reached!')
      }
    }

    if (!timerOutput.isComplete) {
      hasPlayedAlarmRef.current = false
    }
  }, [timerOutput.isComplete, timerState.mode, playAlarm])

  // Auto-stop when daily limit hit (stopwatch mode)
  useEffect(() => {
    if (timerOutput.isComplete && timerState.mode === 'stopwatch' && timerState.id && timerState.status === 'running') {
      // Auto-stop the timer
      startTransition(async () => {
        if (!timerState.id) return
        const result = await stopTimer(timerState.id)
        if ('timer' in result) {
          const newState = {
            id: null,
            mode: timerState.mode,
            status: 'stopped' as const,
            duration: timerState.duration,
            startedAt: null,
            elapsed: 0,
          }
          broadcastTimerUpdate('timer_stopped', newState)
          await refreshDailyTime()
        }
      })
    }
  }, [timerOutput.isComplete, timerState.mode, timerState.id, timerState.status, timerState.duration, broadcastTimerUpdate, refreshDailyTime])

  const handleModeChange = useCallback((newMode: 'countdown' | 'stopwatch' | 'rest', duration?: number) => {
    // Only allow mode change when timer is stopped
    if (timerState.status !== 'stopped') return

    let defaultDuration = 0
    if (newMode === 'countdown') defaultDuration = room.focusDuration
    if (newMode === 'rest') defaultDuration = room.restDuration

    setTimerState(prev => ({
      ...prev,
      mode: newMode,
      duration: duration ?? defaultDuration,
    }))
  }, [timerState.status, setTimerState, room.focusDuration, room.restDuration])

  const handleDurationChange = useCallback((duration: number) => {
    if (timerState.status !== 'stopped') return
    setTimerState(prev => ({
      ...prev,
      duration,
    }))
  }, [timerState.status, setTimerState])

  const handleStart = useCallback((duration: number, mode: 'countdown' | 'stopwatch' | 'rest') => {
    startTransition(async () => {
      stopAlarm()
      const result = await startTimer(room.id, duration, mode)
      if ('error' in result) {
        toast.error(result.error as string)
        return
      }
      if ('timer' in result && result.timer) {
        const newState = {
          id: result.timer.id,
          mode: result.timer.mode as 'countdown' | 'stopwatch' | 'rest',
          status: 'running' as const,
          duration: result.timer.duration,
          startedAt: result.timer.startedAt?.toISOString() ?? new Date().toISOString(),
          elapsed: 0,
        }
        broadcastTimerUpdate('timer_started', newState)

        if (result.dailyRemaining !== undefined) {
          setDailyRemaining(result.dailyRemaining as number)
        }
      }
    })
  }, [room.id, broadcastTimerUpdate, stopAlarm])

  const handlePause = useCallback(() => {
    if (!timerState.id) return
    startTransition(async () => {
      const result = await pauseTimer(timerState.id!)
      if ('timer' in result && result.timer) {
        const newState = {
          ...timerState,
          status: 'paused' as const,
          elapsed: result.timer.elapsed,
          startedAt: null,
        }
        broadcastTimerUpdate('timer_paused', newState)
      }
    })
  }, [timerState, broadcastTimerUpdate])

  const handleResume = useCallback(() => {
    if (!timerState.id) return
    startTransition(async () => {
      const result = await resumeTimer(timerState.id!)
      if ('timer' in result && result.timer) {
        const newState = {
          ...timerState,
          status: 'running' as const,
          startedAt: result.timer.startedAt?.toISOString() ?? new Date().toISOString(),
        }
        broadcastTimerUpdate('timer_resumed', newState)
      }
    })
  }, [timerState, broadcastTimerUpdate])

  const handleStop = useCallback(() => {
    if (!timerState.id) return
    startTransition(async () => {
      stopAlarm()
      const result = await stopTimer(timerState.id!)
      if ('timer' in result) {
        const newState = {
          id: null,
          mode: timerState.mode,
          status: 'stopped' as const,
          duration: timerState.duration,
          startedAt: null,
          elapsed: 0,
        }
        broadcastTimerUpdate('timer_stopped', newState)
        toast.success('Study session recorded!')
        await refreshDailyTime()
      }
    })
  }, [timerState, broadcastTimerUpdate, stopAlarm, refreshDailyTime])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      toast.success('Room code copied!')
    } catch {
      toast.error('Unable to copy. Select and copy the room code below the title.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Room header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Back to dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold break-words min-w-0">{room.name}</h1>
              {isOwner && (
                <Button variant="ghost" size="icon" aria-label="Room settings" className="shrink-0 text-muted-foreground" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
            <button
              aria-label={`Copy room code ${room.code}`}
              onClick={copyCode}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-mono">{room.code}</span>
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Timer section */}
        <div className="flex flex-col items-center gap-8">
          <TimerDisplay
            displaySeconds={timerOutput.displaySeconds}
            progress={timerOutput.progress}
            isRunning={timerOutput.isRunning}
            isPaused={timerOutput.isPaused}
            isComplete={timerOutput.isComplete}
            mode={timerState.mode}
            dailyRemaining={dailyRemaining}
            dailyUsed={dailyUsed}
          />
          <TimerControls
            isRunning={timerOutput.isRunning}
            isPaused={timerOutput.isPaused}
            isOwner={isOwner}
            mode={timerState.mode}
            duration={timerState.duration}
            loading={isPending}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onModeChange={handleModeChange}
            onDurationChange={handleDurationChange}
          />
        </div>

        {/* Sidebar */}
        <div className="border border-border rounded-xl p-4 bg-card h-fit">
          <ParticipantList
            participants={onlineUsers}
            currentUserId={currentUser.id}
          />
        </div>
      </div>

      {isOwner && (
        <RoomSettingsModal
          room={room}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </div>
  )
}
