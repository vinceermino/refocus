import { NextResponse } from 'next/server'
import { getUserData } from '@/lib/actions/user-data'

export async function GET() {
  try {
    const result = await getUserData()
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
