export const GROUP_NOTE_LIMIT = 500
export const PROFILE_NOTE_LIMIT = 300
export type NoteVisibility = 'personal' | 'group'

export class NoteError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export function validateId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new NoteError('Invalid ID.')
  }
}

export function noteText(value: unknown, limit: number, allowEmpty = false) {
  if (typeof value !== 'string') throw new NoteError('Note must be plain text.')
  if (value.length > limit) throw new NoteError(`Note must be ${limit} characters or fewer.`)
  const text = value.trim()
  if (!allowEmpty && !text) throw new NoteError('Please enter a note.')
  return text
}

export function noteVisibility(value: unknown): NoteVisibility {
  if (value !== 'personal' && value !== 'group') throw new NoteError('Invalid note visibility.')
  return value
}
