'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceUser {
  id: string
  username: string
  onlineAt: string
}

export function usePresence(roomId: string, currentUser: { id: string; username: string }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`room-presence:${roomId}`)

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users: PresenceUser[] = []
      const seen = new Set<string>()

      Object.values(state).forEach((presences) => {
        presences.forEach((p) => {
          if (!seen.has(p.id)) {
            seen.add(p.id)
            users.push(p)
          }
        })
      })

      setOnlineUsers(users)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: currentUser.id,
          username: currentUser.username,
          onlineAt: new Date().toISOString(),
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, currentUser.id, currentUser.username,])

  return { onlineUsers }
}
