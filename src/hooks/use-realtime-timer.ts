'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface TimerState {
  id: string | null
  mode: 'countdown' | 'stopwatch' | 'rest'
  status: 'running' | 'paused' | 'stopped'
  duration: number
  startedAt: string | null
  elapsed: number
}

interface BroadcastPayload {
  type: 'timer_started' | 'timer_paused' | 'timer_resumed' | 'timer_stopped'
  timer: TimerState
}

export function useRealtimeTimer(roomId: string, initialTimer?: TimerState | null) {
  const [timerState, setTimerState] = useState<TimerState>(
    initialTimer ?? {
      id: null,
      mode: 'countdown',
      status: 'stopped',
      duration: 25 * 60,
      startedAt: null,
      elapsed: 0,
    }
  )
  const channel = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel(`room-timer:${roomId}`)

    ch.on('broadcast', { event: 'timer_update' }, (payload) => {
      const data = payload.payload as BroadcastPayload
      if (data.timer) {
        setTimerState(data.timer)
      }
    })

    ch.subscribe()
    channel.current = ch

    return () => {
      channel.current = null
      supabase.removeChannel(ch)
    }
  }, [roomId])

  const broadcastTimerUpdate = useCallback(
    (type: BroadcastPayload['type'], timer: TimerState) => {
      if (!channel.current) return
      channel.current.send({
        type: 'broadcast',
        event: 'timer_update',
        payload: { type, timer } as BroadcastPayload,
      })
      setTimerState(timer)
    },
    []
  )

  return { timerState, setTimerState, broadcastTimerUpdate }
}
