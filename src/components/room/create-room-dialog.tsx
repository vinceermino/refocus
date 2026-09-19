'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRoom } from '@/actions/rooms'
import { useUserData } from '@/components/providers/user-data-provider'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { refreshRooms } = useUserData()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await createRoom(formData)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if ('room' in result && result.room) {
        toast.success('Room created!')
        onOpenChange(false)
        refreshRooms()
        router.push(`/room/${result.room.code}`)
      }
    } catch {
      setError('Unable to create the room. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create a Room</DialogTitle>
          <DialogDescription>Create a shared timer and invite others with its room code.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={error ? "create-room-error" : undefined} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium mb-1.5 block">Room Name</label>
            <Input id="name" name="name" autoComplete="off" placeholder='Study Room' required />
          </div>
          {error && <p id="create-room-error" role="alert" className="rounded-lg border border-timer-danger/30 bg-timer-danger/5 p-3 text-sm text-timer-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
