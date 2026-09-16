'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TimerDisplay } from '@/components/timer/timer-display'
import { TimerControls } from '@/components/timer/timer-controls'
import { logPersonalSession } from '@/actions/timer'
import { useUserData } from '@/components/providers/user-data-provider'
import { useLocalTimer } from '@/hooks/use-local-timer'
import { useAlarm } from '@/hooks/use-alarm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function PersonalTimer({ hideJoinRoom = false }: { hideJoinRoom?: boolean }) {
  const router = useRouter()
  const { playAlarm, stopAlarm } = useAlarm()
  const { refreshStats, profile } = useUserData()

  const [timerState, setTimerState] = useState<{
    mode: 'countdown' | 'stopwatch'
    status: 'running' | 'paused' | 'stopped'
    duration: number
    startedAt: string | null
    elapsed: number
  }>({
    mode: 'countdown',
    status: 'stopped',
    duration: 25 * 60,
    startedAt: null,
    elapsed: 0,
  })

  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const timerOutput = useLocalTimer(timerState)

  // Play alarm when timer completes
  useEffect(() => {
    if (timerOutput.isComplete) {
      playAlarm()
      if (timerState.mode === 'countdown') {
        toast.success('⏰ Timer complete! Great focus session!')
      }

      // Auto-stop and log session
      const durationToLog = timerState.duration
      setTimerState(prev => ({
        ...prev,
        status: 'stopped',
        startedAt: null,
        elapsed: 0
      }))

      if (profile && durationToLog > 0) {
        logPersonalSession(durationToLog).then(() => {
          refreshStats()
        }).catch(console.error)
      }
    }
  }, [timerOutput.isComplete, timerState.mode, playAlarm, timerState.duration, profile, refreshStats])

  const handleModeChange = useCallback((newMode: 'countdown' | 'stopwatch', duration?: number) => {
    if (timerState.status !== 'stopped') return
    setTimerState(prev => ({
      ...prev,
      mode: newMode,
      duration: duration ?? (newMode === 'countdown' ? 25 * 60 : 0),
    }))
  }, [timerState.status])

  const handleDurationChange = useCallback((duration: number) => {
    if (timerState.status !== 'stopped') return
    setTimerState(prev => ({
      ...prev,
      duration,
    }))
  }, [timerState.status])

  const handleStart = useCallback((duration: number, mode: 'countdown' | 'stopwatch') => {
    stopAlarm()
    setTimerState({
      mode,
      status: 'running',
      duration,
      startedAt: new Date().toISOString(),
      elapsed: 0,
    })
  }, [stopAlarm])

  const handlePause = useCallback(() => {
    setTimerState(prev => {
      const now = Date.now()
      const started = prev.startedAt ? new Date(prev.startedAt).getTime() : now
      const currentRunElapsed = Math.floor((now - started) / 1000)

      return {
        ...prev,
        status: 'paused',
        elapsed: prev.elapsed + currentRunElapsed,
        startedAt: null,
      }
    })
  }, [])

  const handleResume = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      status: 'running',
      startedAt: new Date().toISOString(),
    }))
  }, [])

  const handleStop = useCallback(() => {
    stopAlarm()

    const now = Date.now()
    const started = timerState.startedAt ? new Date(timerState.startedAt).getTime() : now
    const currentRunElapsed = timerState.status === 'running' ? Math.floor((now - started) / 1000) : 0
    const totalElapsed = timerState.elapsed + currentRunElapsed

    if (profile && totalElapsed > 0) {
      logPersonalSession(totalElapsed).then(() => {
        refreshStats()
      }).catch(console.error)
    }

    setTimerState(prev => ({
      ...prev,
      status: 'stopped',
      startedAt: null,
      elapsed: 0,
    }))
  }, [stopAlarm, profile, refreshStats, timerState])

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsJoining(true)
    // If they have a timer running, maybe we should stop it, or just let them route.
    if (timerState.status === 'running') {
      handleStop()
    }

    router.push(`/room/${roomCode.trim().toUpperCase()}`)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-10">

      {/* Timer Section */}
      <div className="flex flex-col items-center gap-8 w-full p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-accent-glow">



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
          isOwner={true}
          mode={timerState.mode}
          duration={timerState.duration}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onModeChange={handleModeChange}
          onDurationChange={handleDurationChange}
        />
      </div>

    </div>
  )
}
