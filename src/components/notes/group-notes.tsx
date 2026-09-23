'use client'

import { toast } from 'sonner'
import { useApiResource } from '@/hooks/use-api-resource'
import { requestJson } from '@/lib/client-api'
import { GROUP_NOTE_LIMIT } from '@/lib/note-validation'
import type { StudyNote } from '@/lib/note-types'
import { Button } from '@/components/ui/button'
import { NoteEditor } from './note-editor'
import { NoteCard } from './note-card'

export function GroupNotes({ roomId, currentUserId }: { roomId: string; currentUserId: string }) {
  const url = `/api/group-study/${roomId}/notes`
  const { data, error, isLoading, refresh } = useApiResource<{ notes: StudyNote[] }>(url)
  return <section aria-labelledby="group-notes-heading" className="mt-12 space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div><h2 id="group-notes-heading" className="text-xl font-semibold">Notes</h2><p className="mt-1 text-sm text-muted-foreground">Capture a thought for yourself or your study group.</p></div>
      <Button variant="outline" disabled={isLoading} onClick={() => { void refresh() }}>Refresh</Button>
    </div>
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <NoteEditor limit={GROUP_NOTE_LIMIT} label="New note" submitLabel="Add note" share onSave={async (content, visibility) => {
        await requestJson(url, { method: 'POST', body: JSON.stringify({ content, visibility }) })
        toast.success('Note added')
        await refresh()
      }} />
    </div>
    {isLoading && <p role="status" className="text-sm text-muted-foreground">Loading notes…</p>}
    {error && <div role="alert" className="space-y-2 text-sm"><p>{error}</p><Button variant="outline" onClick={() => { void refresh() }}>Try again</Button></div>}
    {data && <div className="space-y-4">
      {data.notes.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No notes yet. Add your first note.</p>}
      {data.notes.map(note => <NoteCard key={note.id} note={note} canEdit={note.authorId === currentUserId} onChange={refresh} />)}
    </div>}
  </section>
}
