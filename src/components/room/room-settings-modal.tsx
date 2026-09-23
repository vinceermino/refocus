'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle, Settings } from 'lucide-react'
import { updateRoomSettings, deleteRoom } from '@/actions/rooms'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RoomSettingsModalProps {
  room: {
    id: string
    name: string
    isPublic: boolean
    description: string
    tags: string[]
    focusDuration: number
    restDuration: number
  }
  isOwner: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomSettingsModal({ room, isOwner, open, onOpenChange }: RoomSettingsModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(room.name)
  const [description, setDescription] = useState(room.description)
  const [tags, setTags] = useState(room.tags.join(', '))
  const [isPublic, setIsPublic] = useState(room.isPublic)
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(String(room.focusDuration / 60))
  const [restDurationMinutes, setRestDurationMinutes] = useState(String(room.restDuration / 60))
  const [error, setError] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Room name cannot be empty')
      return
    }

    startTransition(async () => {
      try {
        const result = await updateRoomSettings(room.id, {
          name,
          isPublic,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          focusDuration: Number(focusDurationMinutes) * 60,
          restDuration: Number(restDurationMinutes) * 60,
        })
        if (result.error) {
          setError(result.error)
        } else {
          toast.success('Room settings updated successfully')
          onOpenChange(false)
          router.refresh()
        }
      } catch {
        setError('Unable to save your changes. Check your connection and try again.')
      }
    })
  }

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteRoom(room.id)
        if (result.error) {
          setError(result.error)
          setIsConfirmingDelete(false)
        } else {
          toast.success('Room deleted successfully')
          onOpenChange(false)
          router.push('/dashboard')
        }
      } catch {
        setError('Unable to delete the room. Check your connection and try again.')
      }
    })
  }

  // Reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsConfirmingDelete(false)
      setName(room.name)
      setIsPublic(room.isPublic)
      setDescription(room.description)
      setTags(room.tags.join(', '))
      setFocusDurationMinutes(String(room.focusDuration / 60))
      setRestDurationMinutes(String(room.restDuration / 60))
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Room Settings
          </DialogTitle>
          <DialogDescription className="minimal-optional">
            Update your room details or manage its lifecycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {error && <p role="alert" className="rounded-lg border border-timer-danger/30 p-3 text-sm text-timer-danger">{error}</p>}
          <form onSubmit={handleSave} aria-busy={isPending} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="room-name" className="text-sm font-medium">Room Name</label>
              <Input
                id="room-name"
                maxLength={80}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="e.g. Late Night Study Session"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-sm font-medium cursor-pointer" htmlFor="public-toggle">
                  {isPublic ? 'Public (Anyone can join)' : 'Private (Invite only)'}
                </label>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Listed in Discover.' : 'Hidden from Discover. Share a code or direct link to invite members.'}
                </p>
              </div>
              <input
                id="public-toggle"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {isPublic && <div className="space-y-3">
              <label htmlFor="room-description" className="text-sm font-medium">Description</label>
              <textarea id="room-description" maxLength={500} value={description} onChange={e => setDescription(e.target.value)} disabled={isPending} className="w-full rounded-lg border border-border bg-background p-3 text-sm" rows={3} />
              <label htmlFor="room-tags" className="text-sm font-medium">Tags (comma separated, up to 8)</label>
              <Input id="room-tags" value={tags} onChange={e => setTags(e.target.value)} disabled={isPending} placeholder="math, quiet study" />
            </div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="focus-duration" className="text-sm font-medium">Focus Duration (min)</label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  id="focus-duration"
                  required
                  value={focusDurationMinutes}
                  onChange={(e) => setFocusDurationMinutes(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="rest-duration" className="text-sm font-medium">Rest Duration (min)</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  id="rest-duration"
                  required
                  value={restDurationMinutes}
                  onChange={(e) => setRestDurationMinutes(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || (name === room.name && description === room.description && tags === room.tags.join(', ') && isPublic === room.isPublic && Number(focusDurationMinutes) * 60 === room.focusDuration && Number(restDurationMinutes) * 60 === room.restDuration)}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

          </form>

          {/* Danger Zone */}
          {isOwner && <div className="pt-6 mt-6 border-t border-border/50">
            <h3 className="text-sm font-semibold text-timer-danger mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h3>
            {isConfirmingDelete ? (
              <div className="space-y-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-timer-danger">Are you absolutely sure? This action cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsConfirmingDelete(false)} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                    {isPending ? 'Deleting...' : 'Yes, Delete Room'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-timer-danger hover:text-timer-danger hover:bg-red-500/10 border-red-500/20"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isPending}
              >
                Delete Room
              </Button>
            )}
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
