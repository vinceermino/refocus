'use client'

import { useState } from 'react'
import { Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
const CreateRoomDialog = dynamic(() => import('@/components/room/create-room-dialog').then(module => module.CreateRoomDialog))
const JoinRoomDialog = dynamic(() => import('@/components/room/join-room-dialog').then(module => module.JoinRoomDialog))

export function DashboardActions() {
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setJoinOpen(true)} className="gap-1.5">
          <LogIn className="h-4 w-4" />
          Join Room
        </Button>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>
      {createOpen && <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />}
      {joinOpen && <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />}
    </>
  )
}
