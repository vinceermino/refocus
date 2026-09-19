import { Clock, Flame, Target, BarChart3, Trophy, Zap } from 'lucide-react'

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[Clock, Flame, Target, BarChart3, Trophy, Zap].map((Icon, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="h-4 w-4" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="h-48 bg-muted/50 rounded-lg animate-pulse" />
      </div>

      {/* Room breakdown skeleton */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-6 w-36 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="flex-1 h-3 bg-muted/50 rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
