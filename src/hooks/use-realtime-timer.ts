'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { heartbeatRoom } from '@/actions/rooms'
import type { RoomParticipant } from '@/components/room/member-list'

interface TimerState {
  id: string | null
  mode: 'countdown' | 'stopwatch' | 'rest'
  status: 'running' | 'paused' | 'stopped'
  duration: number
  startedAt: string | null
  elapsed: number
}

interface RoomSnapshot {
  role: string
  members: RoomParticipant[]
  room: { id: string; name: string; code: string; ownerId: string; isPublic: boolean; description: string; tags: string[]; focusDuration: number; restDuration: number }
  timer: TimerState | null
}

export function useRealtimeTimer(roomId: string, initialTimer?: TimerState | null) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const [timerState, setTimerState] = useState<TimerState>(initialTimer ?? { id: null, mode: 'countdown', status: 'stopped', duration: 1500, startedAt: null, elapsed: 0 })
  const refreshRoom = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store', signal })
      if ([401, 403, 404].includes(response.status)) { router.replace('/dashboard'); return }
      if (!response.ok) return
      const data: RoomSnapshot = await response.json()
      setSnapshot(data)
      setTimerState(previous => {
        const next = data.timer
        if (!next || next.status === 'stopped') return previous.status === 'stopped' ? previous : { ...previous, id: null, status: 'stopped', elapsed: 0, startedAt: null }
        return { id: next.id, mode: next.mode, status: next.status, duration: next.duration, startedAt: next.startedAt, elapsed: next.elapsed }
      })
    } catch { /* Keep the last state on temporary connection loss. */ }
  }, [roomId, router])

  useEffect(() => {
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout>
    const poll = async () => {
      await refreshRoom(controller.signal)
      if (!controller.signal.aborted) timeout = setTimeout(poll, 2000)
    }
    void poll()
    const heartbeat = () => { if (document.visibilityState === 'visible') void heartbeatRoom(roomId).catch(() => {}) }
    heartbeat()
    const interval = setInterval(heartbeat, 20_000)
    window.addEventListener('focus', heartbeat)
    return () => { controller.abort(); clearTimeout(timeout); clearInterval(interval); window.removeEventListener('focus', heartbeat) }
  }, [refreshRoom, roomId])

  // Only responses from authenticated server actions may update local controls.
  // Other clients re-read authorized state instead of trusting client broadcasts.
  const broadcastTimerUpdate = useCallback((_type: string, timer: TimerState) => setTimerState(timer), [])
  return { timerState, setTimerState, broadcastTimerUpdate, snapshot, refreshRoom }
}
