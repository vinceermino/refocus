import { getAuthProfile } from '@/lib/auth-profile'
import { changeGroupNote } from '@/lib/notes'
import { checkNoteOrigin, noteApiError, noteBody, noteResponse } from '@/lib/note-api'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  try {
    const viewer = await getAuthProfile()
    return noteResponse({ note: await changeGroupNote((await params).id, viewer.id, await noteBody(request)) })
  } catch (error) { return noteApiError(error) }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    checkNoteOrigin(request)
    const viewer = await getAuthProfile()
    await changeGroupNote((await params).id, viewer.id, null)
    return noteResponse({ success: true })
  } catch (error) { return noteApiError(error) }
}
