'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
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
  const revision = useRef(0)
  const refreshRoom = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current
    try {
      const response = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store', signal })
      if (signal?.aborted || request !== revision.current) return
      if ([401, 403, 404].includes(response.status)) { router.replace('/dashboard'); return }
      if (!response.ok) return
      const data: RoomSnapshot = await response.json()
      if (signal?.aborted || request !== revision.current) return
      setSnapshot(previous => {
        if (JSON.stringify(previous) === JSON.stringify(data)) return previous
        return { ...data,
          members: JSON.stringify(previous?.members) === JSON.stringify(data.members) ? previous!.members : data.members,
          room: JSON.stringify(previous?.room) === JSON.stringify(data.room) ? previous!.room : data.room,
        }
      })
      setTimerState(previous => {
        const next = data.timer
        if (!next || next.status === 'stopped') return previous.status === 'stopped' ? previous : { ...previous, id: null, status: 'stopped', elapsed: 0, startedAt: null }
        const current = { id: next.id, mode: next.mode, status: next.status, duration: next.duration, startedAt: next.startedAt, elapsed: next.elapsed }
        return (Object.keys(current) as (keyof TimerState)[]).every(key => current[key] === previous[key]) ? previous : current
      })
    } catch { /* Keep the last state on temporary connection loss. */ }
  }, [roomId, router])

  useEffect(() => {
    let controller: AbortController | null = null
    let disposed = false
    let timeout: ReturnType<typeof setTimeout> | undefined
    const available = () => document.visibilityState === 'visible' && navigator.onLine
    const poll = async () => {
      if (disposed || !available() || controller) return
      const request = new AbortController()
      controller = request
      await refreshRoom(request.signal)
      if (controller === request) controller = null
      if (!disposed && !request.signal.aborted && available()) timeout = setTimeout(poll, 2000)
    }
    void poll()
    const heartbeat = () => { if (available()) void heartbeatRoom(roomId).catch(() => {}) }
    const resume = () => {
      clearTimeout(timeout)
      controller?.abort()
      controller = null
      if (available()) { void poll(); heartbeat() }
    }
    heartbeat()
    const interval = setInterval(heartbeat, 20_000)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    window.addEventListener('offline', resume)
    return () => {
      disposed = true
      // Invalidate the latest request, not the revision at effect setup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      revision.current++
      controller?.abort(); clearTimeout(timeout); clearInterval(interval)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('offline', resume)
    }
  }, [refreshRoom, roomId])

  // Only responses from authenticated server actions may update local controls.
  // Other clients re-read authorized state instead of trusting client broadcasts.
  const broadcastTimerUpdate = useCallback((_type: string, timer: TimerState) => { revision.current++; setTimerState(timer) }, [])
  return { timerState, setTimerState, broadcastTimerUpdate, snapshot, refreshRoom }
}
