import { getAuthProfile } from '@/lib/auth-profile'
import { updateProfileNote } from '@/lib/notes'
import { noteApiError, noteBody, noteResponse } from '@/lib/note-api'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await getAuthProfile()
    return noteResponse(await updateProfileNote((await params).id, viewer.id, (await noteBody(request)).profileNote))
  } catch (error) { return noteApiError(error) }
}
