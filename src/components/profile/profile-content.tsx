'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useApiResource } from '@/hooks/use-api-resource'
import type { PublicProfile } from '@/lib/note-types'
import { PROFILE_NOTE_LIMIT } from '@/lib/note-validation'
import { requestJson } from '@/lib/client-api'
import { ProfileLink } from './profile-link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteCard } from '@/components/notes/note-card'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'

export function ProfileContent({ userId }: { userId: string }) {
  const { data, error, isLoading, refresh } = useApiResource<{ profile: PublicProfile }>(`/api/users/${encodeURIComponent(userId)}`)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const profile = data?.profile
  const save = async (profileNote: string) => {
    await requestJson(`/api/users/${userId}/profile-note`, { method: 'PATCH', body: JSON.stringify({ profileNote }) })
    setSaveError(null)
    setEditing(false); setDeleting(false)
    toast.success(profileNote ? 'Profile note saved' : 'Profile note deleted')
    await refresh()
  }
  return <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
    <Link href="/dashboard" className="inline-block text-sm text-muted-foreground hover:underline">← Dashboard</Link>
    {isLoading && <p role="status">Loading profile…</p>}
    {error && <div role="alert" className="space-y-3"><h1 className="text-2xl font-semibold">Unable to load profile</h1><p>{error}</p><Button onClick={() => { void refresh() }}>Try again</Button></div>}
    {profile && <>
      <section className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><h1 className="text-2xl font-bold"><ProfileLink userId={profile.id} username={profile.username} avatar /></h1><p className="mt-3 text-sm text-muted-foreground">Joined <time dateTime={profile.createdAt}>{new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time></p></div>
          {profile.isOwner && <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>}
        </div>
        <div className="space-y-3"><h2 className="text-lg font-semibold">Note</h2>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{profile.profileNote || <MinimalModeText short="No profile note yet.">{profile.isOwner ? 'Add a short note about yourself or what you’re studying.' : 'No profile note yet.'}</MinimalModeText>}</p>
          {profile.isOwner && <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setEditing(true)}>{profile.profileNote ? 'Edit note' : 'Add note'}</Button>
            {profile.profileNote && (deleting ? <>
              <span className="text-sm">Delete your profile note?</span><Button variant="destructive" disabled={pending} onClick={async () => {
                setPending(true); setSaveError(null)
                try { await save('') } catch (err) { setSaveError(err instanceof Error ? err.message : 'Unable to delete note.') }
                finally { setPending(false) }
              }}>{pending ? 'Deleting…' : 'Confirm delete'}</Button><Button variant="ghost" disabled={pending} onClick={() => { setDeleting(false); setSaveError(null) }}>Cancel</Button>
            </> : <Button variant="ghost" onClick={() => setDeleting(true)}>Delete note</Button>)}
          </div>}
          {saveError && <p role="alert" className="text-sm text-timer-danger">{saveError}</p>}
        </div>
      </section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Group study activity</h2>
        <p className="minimal-optional text-sm text-muted-foreground">{profile.isOwner ? 'Your current study rooms.' : 'Study rooms you both belong to.'}</p>
        {profile.activity.length ? <ul className="space-y-3">{profile.activity.map(item => <li key={item.room.id} className="rounded-xl border border-border p-4"><Link href={`/room/${item.room.code}`} className="font-medium text-accent-primary hover:underline break-words">{item.room.name}</Link><p className="mt-1 text-xs text-muted-foreground">{item.role} · Joined {new Date(item.joinedAt).toLocaleDateString()}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No group study activity to show.</p>}
      </section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Recent study notes</h2><p className="minimal-optional text-sm text-muted-foreground">{profile.isOwner ? 'Your latest notes from rooms you belong to.' : 'Shared notes from rooms you both belong to.'}</p>
        {profile.notes.length ? profile.notes.map(note => <NoteCard key={note.id} note={note} canEdit={profile.isOwner} onChange={refresh} />) : <p className="text-sm text-muted-foreground">No study notes to show.</p>}
      </section>
      {profile.isOwner && <Dialog open={editing} onOpenChange={setEditing}><DialogContent onClose={() => setEditing(false)}>
        <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription><MinimalModeText short="Your profile note is public.">Your profile note is visible to everyone who visits your profile.</MinimalModeText></DialogDescription></DialogHeader>
        <NoteEditor initialContent={profile.profileNote} limit={PROFILE_NOTE_LIMIT} allowEmpty label="Profile note / bio" submitLabel="Save note" onCancel={() => setEditing(false)} onSave={save} />
      </DialogContent></Dialog>}
    </>}
  </div>
}
