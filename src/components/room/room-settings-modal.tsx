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
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomSettingsModal({ room, open, onOpenChange }: RoomSettingsModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState(room.name)
  const [isPublic, setIsPublic] = useState(room.isPublic)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Room name cannot be empty')
      return
    }

    startTransition(async () => {
      const result = await updateRoomSettings(room.id, { name, isPublic })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Room settings updated successfully')
        onOpenChange(false)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRoom(room.id)
      if (result.error) {
        toast.error(result.error)
        setIsConfirmingDelete(false)
      } else {
        toast.success('Room deleted successfully')
        onOpenChange(false)
        router.push('/dashboard')
      }
    })
  }

  // Reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setIsConfirmingDelete(false)
        setName(room.name)
        setIsPublic(room.isPublic)
      }, 200) // wait for animation
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
          <DialogDescription>
            Update your room details or manage its lifecycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={isPending}
              placeholder="e.g. Late Night Study Session"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <label className="text-sm font-medium cursor-pointer" htmlFor="public-toggle">
                Public Room
              </label>
              <p className="text-xs text-muted-foreground">
                Anyone with the code can join automatically.
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

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || (name === room.name && isPublic === room.isPublic)}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 mt-6 border-t border-border/50">
            <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h3>
            {isConfirmingDelete ? (
              <div className="space-y-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-500/80">Are you absolutely sure? This action cannot be undone.</p>
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
                className="w-full text-red-500 hover:text-red-500 hover:bg-red-500/10 border-red-500/20" 
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isPending}
              >
                Delete Room
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
