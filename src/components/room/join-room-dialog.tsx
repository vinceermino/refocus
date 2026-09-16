'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinRoom } from '@/actions/rooms'
import { useUserData } from '@/components/providers/user-data-provider'

interface JoinRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshRooms } = useUserData()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await joinRoom(formData)

    if ('error' in result && result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    if ('room' in result && result.room) {
      toast.success('Joined room!')
      onOpenChange(false)
      refreshRooms()
      router.push(`/room/${result.room.code}`)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Join Study Room</DialogTitle>
          <DialogDescription>Enter a room code to join your study partners.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="text-sm font-medium mb-1.5 block">Room Code</label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. ABC123"
              className="font-mono text-center text-lg tracking-widest uppercase"
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
