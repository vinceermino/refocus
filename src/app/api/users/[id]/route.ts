import { AuthenticationError, getAuthProfile } from '@/lib/auth-profile'
import { getPublicProfile } from '@/lib/notes'
import { noteApiError, noteResponse } from '@/lib/note-api'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    let viewerId: string | null = null
    try { viewerId = (await getAuthProfile()).id } catch (error) {
      if (!(error instanceof AuthenticationError)) throw error
    }
    return noteResponse({ profile: await getPublicProfile((await params).id, viewerId) })
  } catch (error) { return noteApiError(error) }
}
