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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { refreshRooms } = useUserData()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await joinRoom(formData)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if ('room' in result && result.room) {
        toast.success('Joined room!')
        onOpenChange(false)
        refreshRooms()
        router.push(`/room/${result.room.code}`)
      }
    } catch {
      setError('Unable to join the room. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Join Study Room</DialogTitle>
          <DialogDescription>Enter a room code to join your study partners.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={error ? "join-room-error" : undefined} className="space-y-4">
          <div>
            <label htmlFor="code" className="text-sm font-medium mb-1.5 block">Room Code</label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. ABC123"
              className="font-mono text-center text-lg tracking-widest uppercase"
              maxLength={6}
              minLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
            />
          </div>
          {error && <p id="join-room-error" role="alert" className="rounded-lg border border-timer-danger/30 bg-timer-danger/5 p-3 text-sm text-timer-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
