'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Compass, Users, Search } from 'lucide-react'
import { joinPublicRoom } from '@/actions/rooms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserData } from '@/components/providers/user-data-provider'
import { MinimalModeText } from '@/components/layout/minimal-mode-text'

interface PublicRoom { id: string; name: string; description: string; tags: string[]; _count: { members: number } }
interface DirectoryState {
  key: string
  rooms: PublicRoom[] | null
  hasMore: boolean
  error: string
  unauthorized: boolean
  loading: boolean
}

function DiscoverRooms() {
  const params = useSearchParams()
  const pathname = usePathname()
  const search = (params.get('q') ?? '').slice(0, 80)
  const requestedPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 100_000 ? requestedPage : 0
  const queryKey = new URLSearchParams({ q: search, page: String(page) }).toString()
  const [directory, setDirectory] = useState<DirectoryState | null>(null)
  const [retry, setRetry] = useState(0)
  const [joinError, setJoinError] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { refreshRooms } = useUserData()
  // Results belong to one URL. Never show cards from a previous search or page.
  const current = directory?.key === queryKey ? directory : null
  const rooms = current?.rooms
  const loading = current?.loading ?? true

  function updateDirectory(nextSearch: string, nextPage: number, replace = false) {
    const next = new URLSearchParams(params.toString())
    if (nextSearch) next.set('q', nextSearch)
    else next.delete('q')
    if (nextPage > 0) next.set('page', String(nextPage))
    else next.delete('page')
    const query = next.toString()
    const url = `${pathname}${query ? `?${query}` : ''}`
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    setJoinError('')
  }

  useEffect(() => {
    let disposed = false
    let unauthorized = false
    let controller: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const empty: DirectoryState = { key: queryKey, rooms: null, hasMore: false, error: '', unauthorized: false, loading: false }
    const available = () => document.visibilityState === 'visible' && navigator.onLine
    const showError = (message: string) => setDirectory(previous => ({
      ...(previous?.key === queryKey ? previous : empty), error: message, loading: false,
    }))

    const load = async () => {
      if (disposed || unauthorized || controller || document.visibilityState !== 'visible') return
      if (!navigator.onLine) {
        showError('You are offline. Reconnect to load public rooms.')
        return
      }
      const request = new AbortController()
      controller = request
      try {
        const response = await fetch(`/api/discover?${queryKey}`, { cache: 'no-store', signal: request.signal })
        if (request.signal.aborted || disposed) return
        if (response.status === 401 || response.status === 403) {
          unauthorized = true
          setDirectory({ ...empty, unauthorized: true, error: 'Your session has ended. Sign in to discover public rooms.' })
          return
        }
        if (!response.ok) throw new Error('Unable to load public rooms.')
        const data: { rooms: PublicRoom[]; hasMore: boolean } = await response.json()
        if (request.signal.aborted || disposed) return
        setDirectory({ ...empty, rooms: data.rooms, hasMore: data.hasMore })
      } catch {
        if (!request.signal.aborted && !disposed) showError('Unable to load public rooms. Check your connection and try again.')
      } finally {
        if (controller === request) controller = null
        if (!request.signal.aborted && !disposed && !unauthorized && available()) timer = setTimeout(load, 2000)
      }
    }

    const resume = () => {
      clearTimeout(timer)
      if (!available()) {
        controller?.abort()
        controller = null
        if (!navigator.onLine && !unauthorized) showError('You are offline. Reconnect to load public rooms.')
        return
      }
      void load()
    }
    // Debounce typing without delaying URL updates or browser Back/Forward.
    timer = setTimeout(load, 200)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    window.addEventListener('offline', resume)
    return () => {
      disposed = true
      controller?.abort()
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('offline', resume)
    }
  }, [queryKey, retry])

  return <>
    <label htmlFor="room-search" className="mb-2 flex items-center gap-2 text-sm font-medium"><Search aria-hidden="true" className="h-4 w-4" /><MinimalModeText short="Search rooms">Search by room name or tag</MinimalModeText></label>
    <Input id="room-search" type="search" maxLength={80} value={search} onChange={event => updateDirectory(event.target.value, 0, true)} placeholder="Try math or quiet study" />
    {current?.error && <div className="mt-4 flex flex-wrap items-center gap-3">
      <p role="alert" className="text-sm text-timer-danger">{current.error}</p>
      {current.unauthorized ? <Link href="/login" className="rounded text-sm font-medium text-accent-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">Sign in</Link> : <Button variant="outline" size="sm" disabled={loading} onClick={() => {
        setDirectory(previous => previous && { ...previous, loading: true })
        setRetry(value => value + 1)
      }}>{loading ? 'Retrying…' : 'Retry'}</Button>}
    </div>}
    {joinError && <p role="alert" className="mt-4 text-sm text-timer-danger">{joinError}</p>}
    <section aria-label="Public rooms" aria-busy={loading}>
      {loading && !rooms && <p role="status" className="py-8 text-sm text-muted-foreground">Loading public rooms…</p>}
      {rooms?.length === 0 && !current?.error && <div className="py-10 text-center">
        <p role="status" className="font-medium">{search ? 'No rooms match your search.' : page > 0 ? 'No more public rooms.' : 'No public rooms yet.'}</p>
        <p className="mt-2 text-sm text-muted-foreground">{search ? 'Try a different name or tag, or browse all rooms.' : page > 0 ? 'Return to the first page to find a room.' : 'Check back soon or create a room from your dashboard.'}</p>
        {(search || page > 0) ? <Button variant="outline" className="mt-4" onClick={() => updateDirectory('', 0)}>Browse all rooms</Button> : <Link href="/dashboard" className="mt-4 inline-block rounded text-sm font-medium text-accent-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">Go to dashboard</Link>}
      </div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{rooms?.map(room => <article key={room.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <h2 className="break-words text-lg font-semibold">{room.name}</h2>
        <p className="break-words text-sm text-muted-foreground">{room.description || 'A place to focus together.'}</p>
        {room.tags.length > 0 && <div className="flex flex-wrap gap-2">{room.tags.map(tag => <button type="button" key={tag} className="min-h-8 rounded-full bg-muted px-3 py-1 text-xs transition-opacity hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" onClick={() => updateDirectory(tag, 0)}>#{tag}</button>)}</div>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1"><span title="Members active in this room within the last minute" className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users aria-hidden="true" className="h-4 w-4" />{room._count.members} active</span>
          <Button disabled={pending} aria-label={`Join ${room.name}`} onClick={() => {
            setJoiningId(room.id)
            setJoinError('')
            startTransition(async () => {
              try {
                const result = await joinPublicRoom(room.id)
                if (result.error) { setJoinError(result.error); return }
                if (result.room) {
                  void refreshRooms()
                  router.push(`/room/${result.room.code}`)
                }
              } catch { setJoinError('Unable to join this room. Please try again.') }
            })
          }}>{pending && joiningId === room.id ? 'Joining…' : 'Join'}</Button>
        </div>
      </article>)}</div>
      {!current?.unauthorized && (page > 0 || current?.hasMore) && <nav aria-label="Directory pages" className="mt-6 flex items-center justify-center gap-4"><Button variant="outline" disabled={page === 0 || loading} onClick={() => updateDirectory(search, page - 1)}>Previous</Button><span className="text-sm">Page {page + 1}</span><Button variant="outline" disabled={!current?.hasMore || loading} onClick={() => updateDirectory(search, page + 1)}>Next</Button></nav>}
    </section>
  </>
}

export default function DiscoverPage() {
  return <div className="mx-auto max-w-4xl px-4 py-8">
    <div className="mb-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Compass aria-hidden="true" className="h-6 w-6 text-accent-primary" />Discover rooms</h1>
      <p className="minimal-optional mt-2 text-sm text-muted-foreground">Find a public room and focus together.</p>
    </div>
    <Suspense fallback={<p role="status" className="py-8 text-sm text-muted-foreground">Loading public rooms…</p>}><DiscoverRooms /></Suspense>
  </div>
}
