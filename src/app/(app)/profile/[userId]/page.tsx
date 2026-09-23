import { Suspense } from 'react'
import { ProfileContent } from '@/components/profile/profile-content'

async function ProfileRoute({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <ProfileContent key={userId} userId={userId} />
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  return <Suspense fallback={<p role="status" className="p-8">Loading profile…</p>}><ProfileRoute params={params} /></Suspense>
}
