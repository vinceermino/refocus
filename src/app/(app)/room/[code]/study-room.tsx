'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TimerDisplay } from '@/components/timer/timer-display'
import { TimerControls } from '@/components/timer/timer-controls'
import { ParticipantList } from '@/components/timer/participant-list'
import { useLocalTimer } from '@/hooks/use-local-timer'
import { useRealtimeTimer } from '@/hooks/use-realtime-timer'
import { usePresence } from '@/hooks/use-presence'
import { startTimer, pauseTimer, resumeTimer, stopTimer } from '@/actions/timer'
import { Button } from '@/components/ui/button'

interface StudyRoomProps {
  room: {
    id: string
    name: string
    code: string
    ownerId: string
  }
  currentUser: {
    id: string
    username: string
    avatarUrl?: string | null
  }
  isOwner: boolean
  initialTimer: {
    id: string
    mode: 'countdown' | 'stopwatch'
    status: 'running' | 'paused' | 'stopped'
    duration: number
    startedAt: string | null
    elapsed: number
  } | null
}

export function StudyRoom({ room, currentUser, isOwner, initialTimer }: StudyRoomProps) {
  const { timerState, broadcastTimerUpdate } = useRealtimeTimer(room.id, initialTimer)
  const { onlineUsers } = usePresence(room.id, currentUser)
  const timerOutput = useLocalTimer(timerState)

  const handleStart = useCallback(async (duration: number, mode: 'countdown' | 'stopwatch') => {
    const result = await startTimer(room.id, duration, mode)
    if ('timer' in result && result.timer) {
      const newState = {
        id: result.timer.id,
        mode: result.timer.mode as 'countdown' | 'stopwatch',
        status: 'running' as const,
        duration: result.timer.duration,
        startedAt: result.timer.startedAt?.toISOString() ?? new Date().toISOString(),
        elapsed: 0,
      }
      broadcastTimerUpdate('timer_started', newState)
    }
  }, [room.id, broadcastTimerUpdate])

  const handlePause = useCallback(async () => {
    if (!timerState.id) return
    const result = await pauseTimer(timerState.id)
    if ('timer' in result && result.timer) {
      const newState = {
        ...timerState,
        status: 'paused' as const,
        elapsed: result.timer.elapsed,
        startedAt: null,
      }
      broadcastTimerUpdate('timer_paused', newState)
    }
  }, [timerState, broadcastTimerUpdate])

  const handleResume = useCallback(async () => {
    if (!timerState.id) return
    const result = await resumeTimer(timerState.id)
    if ('timer' in result && result.timer) {
      const newState = {
        ...timerState,
        status: 'running' as const,
        startedAt: result.timer.startedAt?.toISOString() ?? new Date().toISOString(),
      }
      broadcastTimerUpdate('timer_resumed', newState)
    }
  }, [timerState, broadcastTimerUpdate])

  const handleStop = useCallback(async () => {
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
      toast.success('Study session recorded!')
    }
  }, [timerState, broadcastTimerUpdate])

  const copyCode = () => {
    navigator.clipboard.writeText(room.code)
    toast.success('Room code copied!')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Room header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <button
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
          />
          <TimerControls
            isRunning={timerOutput.isRunning}
            isPaused={timerOutput.isPaused}
            isOwner={isOwner}
            mode={timerState.mode}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
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
    </div>
  )
}
