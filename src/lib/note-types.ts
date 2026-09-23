import type { NoteVisibility } from '@/lib/note-validation'

export interface StudyNote {
  id: string
  authorId: string
  groupStudyId: string
  content: string
  visibility: NoteVisibility
  createdAt: string
  updatedAt: string
  author: { id: string; username: string }
  groupStudy?: { id: string; name: string; code: string }
}

export interface PublicProfile {
  id: string
  username: string
  profileNote: string
  createdAt: string
  isOwner: boolean
  activity: { joinedAt: string; role: string; room: { id: string; name: string; code: string } }[]
  notes: StudyNote[]
}
