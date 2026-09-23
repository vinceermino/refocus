import { NextResponse } from 'next/server'
import { unstable_rethrow } from 'next/navigation'
import { AuthenticationError } from '@/lib/auth-profile'
import { NoteError } from '@/lib/note-validation'

export function noteResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export function noteApiError(error: unknown) {
  unstable_rethrow(error)
  if (error instanceof AuthenticationError) return noteResponse({ error: 'Sign in to continue.' }, 401)
  if (error instanceof NoteError) return noteResponse({ error: error.message }, error.status)
  console.error('Notes/profile request failed', error)
  return noteResponse({ error: 'Unable to complete this request. Please try again.' }, 500)
}

export function checkNoteOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) throw new NoteError('Request origin not allowed.', 403)
}

export async function noteBody(request: Request): Promise<Record<string, unknown>> {
  checkNoteOrigin(request)
  const text = await request.text()
  if (text.length > 8192) throw new NoteError('Request is too large.', 413)
  let body: unknown
  try { body = JSON.parse(text) } catch { throw new NoteError('Invalid JSON.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new NoteError('Expected a JSON object.')
  return body as Record<string, unknown>
}
