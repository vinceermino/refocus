'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { noteText, type NoteVisibility } from '@/lib/note-validation'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'

export function NoteEditor({ initialContent = '', initialVisibility = 'personal', limit, label = 'Note', submitLabel, allowEmpty = false, share = false, onSave, onCancel }: {
  initialContent?: string; initialVisibility?: NoteVisibility; limit: number; label?: string; submitLabel: string
  allowEmpty?: boolean; share?: boolean; onSave: (content: string, visibility: NoteVisibility) => Promise<void>; onCancel?: () => void
}) {
  const id = useId()
  const [content, setContent] = useState(initialContent)
  const [visibility, setVisibility] = useState(initialVisibility)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <form className="space-y-3" aria-busy={pending} onSubmit={async event => {
    event.preventDefault()
    if (pending) return
    setError(null)
    try {
      const value = noteText(content, limit, allowEmpty)
      setPending(true)
      await onSave(value, visibility)
      if (!onCancel) { setContent(''); setVisibility('personal') }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save note. Please try again.') }
    finally { setPending(false) }
  }}>
    <label htmlFor={id} className="block text-sm font-medium">{label}</label>
    <textarea id={id} value={content} onChange={event => setContent(event.target.value)} maxLength={limit} required={!allowEmpty}
      disabled={pending} rows={3} aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`} aria-invalid={!!error}
      className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-relaxed disabled:opacity-60" />
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      {share ? <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={visibility === 'group'} disabled={pending} onChange={event => setVisibility(event.target.checked ? 'group' : 'personal')} className="h-4 w-4 accent-accent-primary" />Share with group
      </label> : <span className="minimal-optional">Plain text</span>}
      <span id={`${id}-count`}>{content.length}/{limit} characters</span>
    </div>
    {share && <p className="text-xs text-muted-foreground"><MinimalModeText short={visibility === 'personal' ? 'Only you' : 'Visible to room members'}>{visibility === 'personal' ? 'Only you can see this note.' : 'All active members of this room can see this note.'}</MinimalModeText></p>}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-timer-danger">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={pending || (!allowEmpty && !content.trim())}>{pending ? 'Saving…' : submitLabel}</Button>
      {onCancel && <Button variant="ghost" disabled={pending} onClick={onCancel}>Cancel</Button>}
    </div>
  </form>
}
