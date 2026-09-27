'use client'

import { useState, useCallback, useEffect } from 'react'
import { TimerDisplay } from '@/components/timer/timer-display'
import { MemoTimerControls as TimerControls } from '@/components/timer/timer-controls'
import { logPersonalSession } from '@/actions/timer'
import { useUserData } from '@/components/providers/user-data-context'
import { useLocalTimer, type TimerState } from '@/hooks/use-local-timer'
import { useAlarm } from '@/hooks/use-alarm'
import { toast } from 'sonner'
import { MemoDailyGoal as DailyGoal } from '@/components/timer/daily-goal'
import { useTimerFullscreen } from '@/hooks/use-timer-fullscreen'
import { FullscreenToggle } from '@/components/timer/fullscreen-toggle'
import { FullscreenChrome } from '@/components/timer/fullscreen-chrome'

export function PersonalTimer() {
  const { playAlarm, stopAlarm } = useAlarm()
  const { refreshStats, profile } = useUserData()

  const [timerState, setTimerState] = useState<TimerState>({
    id: null,
    mode: 'countdown',
    status: 'stopped',
    duration: 25 * 60,
    startedAt: null,
    elapsed: 0,
  })

  const timerOutput = useLocalTimer(timerState)
  const { ref, fullscreen, enabled, setEnabled, supported, announcement, requestOnStart, exit } = useTimerFullscreen(timerState.status, timerOutput.isComplete)

  // Play alarm when timer completes
  useEffect(() => {
    if (timerOutput.isComplete) {
      const completion = window.setTimeout(() => {
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

        if (profile && timerState.mode !== 'rest' && durationToLog > 0) {
          logPersonalSession(durationToLog).then(result => {
            if (result.error) toast.error(result.error)
            else void refreshStats()
          }).catch(() => toast.error('Unable to save your session. Please check your connection.'))
        }
      }, 0)
      return () => window.clearTimeout(completion)
    }
  }, [timerOutput.isComplete, timerState.mode, playAlarm, timerState.duration, profile, refreshStats])

  const handleModeChange = useCallback((newMode: 'countdown' | 'stopwatch' | 'rest', duration?: number) => {
    if (timerState.status !== 'stopped') return
    setTimerState(prev => ({
      ...prev,
      mode: newMode,
      duration: duration ?? (newMode === 'countdown' ? 25 * 60 : newMode === 'rest' ? 5 * 60 : 0),
    }))
  }, [timerState.status])

  const handleDurationChange = useCallback((duration: number) => {
    if (timerState.status !== 'stopped') return
    setTimerState(prev => ({
      ...prev,
      duration,
    }))
  }, [timerState.status])

  const handleStart = useCallback((duration: number, mode: 'countdown' | 'stopwatch' | 'rest') => {
    requestOnStart()
    stopAlarm()
    setTimerState({
      id: null,
      mode,
      status: 'running',
      duration,
      startedAt: new Date().toISOString(),
      elapsed: 0,
    })
  }, [stopAlarm, requestOnStart])

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

    if (profile && timerState.mode !== 'rest' && totalElapsed > 0) {
      logPersonalSession(totalElapsed).then(result => {
        if (result.error) toast.error(result.error)
        else void refreshStats()
      }).catch(() => toast.error('Unable to save your session. Please check your connection.'))
    }

    setTimerState(prev => ({
      ...prev,
      status: 'stopped',
      startedAt: null,
      elapsed: 0,
    }))
  }, [stopAlarm, profile, refreshStats, timerState])

  return (
    <div className="personal-timer flex w-full max-w-md flex-col items-center gap-6 mx-auto">
      {profile && <DailyGoal />}

      {/* Timer Section */}
      <div ref={ref} data-fullscreen={fullscreen} data-timer-status={timerState.status} className="timer-panel flex w-full flex-col items-center gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <FullscreenChrome active={fullscreen} announcement={announcement} onExit={exit} />
        <TimerDisplay
          endsAt={timerOutput.endsAt}
          displaySeconds={timerOutput.displaySeconds}
          progress={timerOutput.progress}
          isRunning={timerOutput.isRunning}
          isPaused={timerOutput.isPaused}
          isComplete={timerOutput.isComplete}
          mode={timerState.mode}
        />

        <div className="timer-control-group flex w-full flex-col items-center gap-3">
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
        <FullscreenToggle enabled={enabled} onChange={setEnabled} supported={supported} />
        </div>
      </div>

    </div>
  )
}
