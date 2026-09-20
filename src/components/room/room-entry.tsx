'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinRoom, requestRoomAccess } from '@/actions/rooms'
import { Button } from '@/components/ui/button'

export function RoomEntry({ room }: { room: { id: string; code: string; name: string; isPublic: boolean } }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const router = useRouter()
  return <div className="max-w-lg mx-auto p-8 space-y-4">
    <h1 className="text-2xl font-bold">Join {room.name}</h1>
    <p className="text-muted-foreground">{room.isPublic ? 'Anyone can join this public room.' : 'This private room is available through your invitation link or code.'}</p>
    {message && <p role="status">{message}</p>}
    <Button disabled={pending} onClick={() => startTransition(async () => {
      try {
        const data = new FormData(); data.set('code', room.code)
        const result = await joinRoom(data)
        if (result.error) setMessage(result.error)
        else router.refresh()
      } catch { setMessage('Unable to join. Please try again.') }
    })}>{pending ? 'Please wait…' : 'Join room'}</Button>
    {!room.isPublic && <Button className="ml-2" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
      try {
        const result = await requestRoomAccess(room.id)
        setMessage(result.error ?? 'Request sent. Return here after an admin approves it.')
      } catch { setMessage('Unable to request access. Please try again.') }
    })}>Request approval</Button>}
  </div>
}
