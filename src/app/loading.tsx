export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent-primary-soft/30">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-accent-primary/30" />
        <div className="h-4 w-24 rounded bg-accent-primary/20" />
      </div>
    </div>
  )
}
