'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, Users, Search } from 'lucide-react'
import { joinPublicRoom } from '@/actions/rooms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserData } from '@/components/providers/user-data-provider'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'

interface PublicRoom { id: string; name: string; description: string; tags: string[]; _count: { members: number } }

export default function DiscoverPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [rooms, setRooms] = useState<PublicRoom[] | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { refreshRooms } = useUserData()
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    const load = async () => {
      try {
        const response = await fetch(`/api/discover?q=${encodeURIComponent(search)}&page=${page}`, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load public rooms. Please try again.')
        const data = await response.json()
        setRooms(data.rooms)
        setHasMore(data.hasMore)
        setError('')
      } catch {
        if (!controller.signal.aborted) { setRooms([]); setError('Unable to load public rooms. Reconnecting…') }
      }
      if (!controller.signal.aborted) timer = setTimeout(load, 2000)
    }
    timer = setTimeout(load, 200)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [search, page])

  return <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="mb-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><Compass className="h-7 w-7 text-accent-primary" />Discover rooms</h1>
      <p className="minimal-optional mt-2 text-muted-foreground">Find a public room and focus together.</p>
    </div>
    <label htmlFor="room-search" className="mb-2 flex items-center gap-2 text-sm font-medium"><Search className="h-4 w-4" /><MinimalModeText short="Search rooms">Search by room name or tag</MinimalModeText></label>
    <Input id="room-search" type="search" maxLength={80} value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Try math or quiet study" />
    {error && <p role="alert" className="my-4 text-timer-danger">{error}</p>}
    {rooms === null ? <p role="status" className="py-8">Loading public rooms…</p> : !rooms.length && !error ? <p role="status" className="py-8 text-muted-foreground">No public rooms match your search.</p> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{rooms?.map(room => <article key={room.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h2 className="break-words text-xl font-semibold">{room.name}</h2>
      <p className="break-words text-sm text-muted-foreground">{room.description || 'A place to focus together.'}</p>
      <div className="flex flex-wrap gap-2">{room.tags.map(tag => <button key={tag} className="rounded-full bg-muted px-2 py-1 text-xs" onClick={() => { setSearch(tag); setPage(0) }}>#{tag}</button>)}</div>
      <div className="mt-auto flex items-center justify-between gap-3"><span title="Members active in this room within the last minute" className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-4 w-4" />{room._count.members} active</span>
        <Button disabled={pending} aria-label={`Join ${room.name}`} onClick={() => startTransition(async () => {
          try {
            const result = await joinPublicRoom(room.id)
            if (result.error) { setError(result.error); setRooms(current => current?.filter(r => r.id !== room.id) ?? []); return }
            if (result.room) { await refreshRooms(); router.push(`/room/${result.room.code}`) }
          } catch { setError('Unable to join this room. Please try again.') }
        })}>{pending ? 'Joining…' : 'Join'}</Button>
      </div>
    </article>)}</div>
    {(page > 0 || hasMore) && <nav aria-label="Directory pages" className="mt-6 flex items-center justify-center gap-4"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm">Page {page + 1}</span><Button variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</Button></nav>}
  </div>
}
