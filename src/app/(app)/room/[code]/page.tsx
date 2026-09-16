import { Suspense } from 'react'
import { RoomContent } from './room-content'

interface RoomPageProps {
  params: Promise<{ code: string }>
}

function RoomSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="h-48 w-48 rounded-full bg-muted animate-pulse" />
        <div className="h-12 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomContent paramsPromise={params} />
    </Suspense>
  )
}
