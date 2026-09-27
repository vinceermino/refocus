import { Suspense } from 'react'
import { RoomSkeleton } from '@/components/layout/page-skeletons'
import { RoomContent } from './room-content'

interface RoomPageProps {
  params: Promise<{ code: string }>
}


export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomContent paramsPromise={params} />
    </Suspense>
  )
}
