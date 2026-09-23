import { getAuthProfile } from '@/lib/auth-profile'
import { createGroupNote, listGroupNotes } from '@/lib/notes'
import { noteApiError, noteBody, noteResponse } from '@/lib/note-api'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await getAuthProfile()
    return noteResponse({ notes: await listGroupNotes((await params).id, viewer.id) })
  } catch (error) { return noteApiError(error) }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const viewer = await getAuthProfile()
    return noteResponse({ note: await createGroupNote((await params).id, viewer.id, await noteBody(request)) }, 201)
  } catch (error) { return noteApiError(error) }
}
