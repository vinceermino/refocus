import { getUserRooms } from '@/actions/rooms'
import { getProfile } from '@/actions/auth'
import { RoomCard } from '@/components/room/room-card'
import { DashboardActions } from './dashboard-actions'
import { Timer, Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils'

export default async function DashboardPage() {
  const [rooms, profile] = await Promise.all([
    getUserRooms(),
    getProfile(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Hello {profile?.username}!</h1>
        </div>
        <DashboardActions />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Study Time</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {formatTime(profile?.totalStudyTime ?? 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="h-4 w-4" />
            <span className="text-sm">Active Rooms</span>
          </div>
          <p className="text-2xl font-bold">{rooms.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm">Live Sessions</span>
          </div>
          <p className="text-2xl font-bold">
            {rooms.filter((r: { timers: Array<{ status: string }> }) => r.timers.some((t: { status: string }) => t.status === 'running')).length}
          </p>
        </div>
      </div>

      {/* Rooms */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
        {rooms.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Timer className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No rooms yet. Create or join one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room: { id: string; name: string; code: string; _count: { members: number }; timers: Array<{ status: string; mode: string }> }) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
