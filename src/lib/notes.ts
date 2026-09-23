import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { lockRoom, roomRole } from '@/lib/room-access'
import { GROUP_NOTE_LIMIT, PROFILE_NOTE_LIMIT, NoteError, noteText, noteVisibility, validateId } from '@/lib/note-validation'

const author = { select: { id: true, username: true } } as const
const newestFirst = [{ createdAt: 'desc' }, { id: 'desc' }] as const

async function requireMembership(tx: Prisma.TransactionClient, roomId: string, viewerId: string) {
  await lockRoom(tx, roomId)
  if (!await roomRole(roomId, viewerId, tx)) throw new NoteError('You must be an active member of this room.', 403)
}

export async function listGroupNotes(roomId: string, viewerId: string) {
  validateId(roomId)
  return prisma.$transaction(async tx => {
    await requireMembership(tx, roomId, viewerId)
    return tx.groupStudyNote.findMany({
      where: { groupStudyId: roomId, OR: [{ authorId: viewerId }, { visibility: 'group' }] },
      include: { author }, orderBy: [...newestFirst],
    })
  })
}

export async function createGroupNote(roomId: string, viewerId: string, body: Record<string, unknown>) {
  validateId(roomId)
  const content = noteText(body.content, GROUP_NOTE_LIMIT)
  const visibility = noteVisibility(body.visibility === undefined ? 'personal' : body.visibility)
  return prisma.$transaction(async tx => {
    await requireMembership(tx, roomId, viewerId)
    return tx.groupStudyNote.create({ data: { authorId: viewerId, groupStudyId: roomId, content, visibility }, include: { author } })
  })
}

export async function changeGroupNote(id: string, viewerId: string, body: Record<string, unknown> | null) {
  validateId(id)
  const data: { content?: string; visibility?: 'personal' | 'group' } = {}
  if (body) {
    if ('content' in body) data.content = noteText(body.content, GROUP_NOTE_LIMIT)
    if ('visibility' in body) data.visibility = noteVisibility(body.visibility)
    if (!Object.keys(data).length) throw new NoteError('Provide content or visibility to update.')
  }
  return prisma.$transaction(async tx => {
    // Find the room, then acquire its lock and re-read before authorization.
    const initial = await tx.groupStudyNote.findUnique({ where: { id }, select: { groupStudyId: true } })
    if (!initial) throw new NoteError('Note not found.', 404)
    await requireMembership(tx, initial.groupStudyId, viewerId)
    const note = await tx.groupStudyNote.findUnique({ where: { id } })
    if (!note || note.authorId !== viewerId) throw new NoteError('Note not found.', 404)
    if (!body) { await tx.groupStudyNote.delete({ where: { id } }); return null }
    return tx.groupStudyNote.update({ where: { id }, data, include: { author } })
  })
}

export async function getPublicProfile(id: string, viewerId: string | null) {
  validateId(id)
  const profile = await prisma.profile.findUnique({
    where: { id }, select: { id: true, username: true, profileNote: true, createdAt: true },
  })
  if (!profile) throw new NoteError('Profile not found.', 404)
  // Profiles are public; room membership, invitation codes and personal notes
  // are only returned to viewers with current access to the corresponding room.
  const visibleRoom = { members: { some: { profileId: viewerId ?? '', status: 'active' } } }
  const [activity, notes] = viewerId ? await Promise.all([
    prisma.roomMember.findMany({
      where: { profileId: id, status: 'active', room: visibleRoom },
      select: { joinedAt: true, role: true, room: { select: { id: true, name: true, code: true } } },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.groupStudyNote.findMany({
      where: { authorId: id, groupStudy: visibleRoom, ...(id === viewerId ? {} : { visibility: 'group' }) },
      include: { author, groupStudy: { select: { id: true, name: true, code: true } } },
      orderBy: [...newestFirst], take: 50,
    }),
  ]) : [[], []]
  return { ...profile, isOwner: viewerId === id, activity, notes }
}

export async function updateProfileNote(id: string, viewerId: string, value: unknown) {
  validateId(id)
  if (id !== viewerId) throw new NoteError('You can only edit your own profile.', 403)
  const profileNote = noteText(value, PROFILE_NOTE_LIMIT, true)
  return prisma.profile.update({ where: { id }, data: { profileNote }, select: { profileNote: true } })
}
