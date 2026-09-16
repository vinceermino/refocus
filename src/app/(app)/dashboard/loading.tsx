import { Timer, Clock } from 'lucide-react'

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="h-9 w-48 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Study Time</span>
          </div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="h-4 w-4" />
            <span className="text-sm">Active Rooms</span>
          </div>
          <div className="h-8 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm">Live Sessions</span>
          </div>
          <div className="h-8 w-12 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
