import { NextResponse } from 'next/server'
import { unstable_rethrow } from 'next/navigation'
import { AuthenticationError, getAuthProfile } from '@/lib/auth-profile'
import { discoverRooms } from '@/lib/discovery'

export async function GET(request: Request) {
  try {
    await getAuthProfile()
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    if (!Number.isSafeInteger(page) || page < 0 || page > 100_000) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 })
    const rooms = await discoverRooms(params.get('q') ?? '', page)
    return NextResponse.json({ rooms: rooms.slice(0, 24), hasMore: rooms.length > 24 }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    unstable_rethrow(error)
    return NextResponse.json({ error: 'Unable to load public rooms. Please try again.' }, { status: error instanceof AuthenticationError ? 401 : 500 })
  }
}
