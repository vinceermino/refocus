'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { StudyNote } from '@/lib/note-types'
import { GROUP_NOTE_LIMIT } from '@/lib/note-validation'
import { requestJson } from '@/lib/client-api'
import { ProfileLink } from '@/components/profile/profile-link'
import { NoteEditor } from './note-editor'
import { Button } from '@/components/ui/button'

export function NoteCard({ note, canEdit = false, onChange }: { note: StudyNote; canEdit?: boolean; onChange?: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <article className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ProfileLink userId={note.author.id} username={note.author.username} avatar className="text-sm font-medium" />
      <span className="text-xs text-muted-foreground">{note.visibility === 'personal' ? 'Personal' : 'Shared with group'}</span>
    </div>
    <p className="text-xs text-muted-foreground"><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time>{note.updatedAt !== note.createdAt && ' · Edited'}</p>
    {note.groupStudy && <Link href={`/room/${note.groupStudy.code}`} className="inline-block text-sm text-accent-primary hover:underline break-words">{note.groupStudy.name}</Link>}
    {editing && canEdit ? <NoteEditor initialContent={note.content} initialVisibility={note.visibility} limit={GROUP_NOTE_LIMIT} share submitLabel="Save changes" label="Edit note" onCancel={() => setEditing(false)} onSave={async (content, visibility) => {
      await requestJson(`/api/notes/${note.id}`, { method: 'PATCH', body: JSON.stringify({ content, visibility }) })
      setEditing(false)
      toast.success('Note updated')
      await onChange?.()
    }} /> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{note.content}</p>}
    {canEdit && !editing && <div className="flex flex-wrap items-center gap-2">
      {deleting ? <>
        <span className="text-sm">Delete this note?</span>
        <Button variant="destructive" disabled={pending} onClick={async () => {
          setPending(true); setError(null)
          try {
            await requestJson(`/api/notes/${note.id}`, { method: 'DELETE' })
            toast.success('Note deleted')
            await onChange?.()
          } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete note.') }
          finally { setPending(false) }
        }}>{pending ? 'Deleting…' : 'Delete note'}</Button>
        <Button variant="ghost" disabled={pending} onClick={() => { setDeleting(false); setError(null) }}>Cancel</Button>
      </> : <>
        <Button variant="ghost" onClick={() => setEditing(true)}>Edit note</Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>Delete note</Button>
      </>}
    </div>}
    {error && <p role="alert" className="text-sm text-timer-danger">{error}</p>}
  </article>
}
