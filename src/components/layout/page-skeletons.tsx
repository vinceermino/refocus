function TimerSkeleton({ room = false }: { room?: boolean }) {
  const goal = <div className="h-28 w-full rounded-xl bg-muted animate-pulse" />
  return <div aria-hidden="true" className="personal-timer mx-auto flex w-full max-w-md flex-col items-center gap-6">
    {!room && goal}
    <div className={`${room ? 'room-timer-panel' : 'timer-panel'} flex w-full flex-col items-center gap-6 rounded-xl border border-border bg-card p-6`}>
      <div className="timer-display aspect-square w-64 max-w-full rounded-full bg-muted animate-pulse" />
      {room && goal}
      <div className="flex w-full max-w-sm flex-col gap-4"><div className="h-12 rounded-lg bg-muted animate-pulse" /><div className="h-10 rounded-lg bg-muted animate-pulse" /><div className="h-12 rounded-lg bg-muted animate-pulse" /><div className="mx-auto h-5 w-40 rounded bg-muted animate-pulse" /></div>
    </div>
  </div>
}

export function DashboardSkeleton() {
  return <div role="status" aria-label="Loading dashboard" className="dashboard-shell mx-auto max-w-4xl px-4 py-8">
    <div aria-hidden="true" className="dashboard-header mb-8 flex flex-col justify-between gap-4 sm:flex-row">
      <div className="space-y-3"><div className="h-9 w-48 rounded bg-muted animate-pulse" /><div className="minimal-optional h-8 w-64 max-w-full rounded bg-muted animate-pulse" /></div>
      <div className="h-10 w-64 max-w-full rounded bg-muted animate-pulse" />
    </div>
    <div className="mb-12"><TimerSkeleton /></div>
    <div aria-hidden="true" className="minimal-optional mb-8 grid grid-cols-1 gap-6 border-y border-border py-4 sm:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}</div>
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
  </div>
}

export function AnalyticsSkeleton() {
  return <div role="status" aria-label="Loading analytics" className="mx-auto max-w-5xl px-4 py-8">
    <div aria-hidden="true" className="mb-8 h-16 w-56 rounded bg-muted animate-pulse" />
    <div aria-hidden="true" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
    <div aria-hidden="true" className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="h-64 rounded-2xl bg-muted animate-pulse" /><div className="h-64 rounded-2xl bg-muted animate-pulse" /></div>
    <div aria-hidden="true" className="h-48 rounded-2xl bg-muted animate-pulse" />
  </div>
}

export function RoomSkeleton() {
  return <div role="status" aria-label="Loading room" className="study-room-shell mx-auto max-w-5xl px-4 py-8">
    <div aria-hidden="true" className="mb-8 h-16 w-64 rounded bg-muted animate-pulse" />
    <div className="study-room-layout grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
      <TimerSkeleton room />
      <div aria-hidden="true" className="h-80 rounded-xl bg-muted animate-pulse" />
    </div>
    <div aria-hidden="true" className="mt-12 h-48 rounded-xl bg-muted animate-pulse" />
  </div>
}
