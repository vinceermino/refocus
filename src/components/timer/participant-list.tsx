'use client'

import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  username: string
  avatarUrl?: string | null
  onlineAt: string
}

interface ParticipantListProps {
  participants: Participant[]
  currentUserId: string
}

export function ParticipantList({ participants, currentUserId }: ParticipantListProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        {participants.length} Online
      </h3>
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors animate-fade-in',
              p.id === currentUserId && 'bg-accent-primary/5'
            )}
          >
            <Avatar
              fallback={p.username}
              src={p.avatarUrl}
              size="sm"
              showOnline
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {p.username}
                {p.id === currentUserId && (
                  <span className="text-xs text-muted-foreground ml-1">(You)</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
