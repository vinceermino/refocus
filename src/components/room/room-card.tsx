import Link from 'next/link'
import { Users, Timer, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RoomCardProps {
  room: {
    id: string
    name: string
    code: string
    _count: { members: number }
    timers: Array<{ status: string; mode: string }>
  }
}

export function RoomCard({ room }: RoomCardProps) {
  const activeTimer = room.timers[0]

  return (
    <Link href={`/room/${room.code}`}>
      <Card className="hover:border-accent-primary/50 transition-all hover:shadow-md cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="group-hover:text-accent-primary transition-colors">
              {room.name}
            </CardTitle>
            {activeTimer && (
              <Badge variant={activeTimer.status === 'running' ? 'success' : 'warning'}>
                {activeTimer.status === 'running' ? 'Live' : 'Paused'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {room._count.members} member{room._count.members !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs bg-muted px-2 py-0.5 rounded">
              {room.code}
            </div>
            {activeTimer && (
              <div className="flex items-center gap-1.5">
                {activeTimer.mode === 'stopwatch' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Timer className="h-4 w-4" />
                )}
                {activeTimer.mode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
