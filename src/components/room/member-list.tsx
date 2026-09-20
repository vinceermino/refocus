'use client'

import { useState, useTransition } from 'react'
import { Crown, Shield, MoreHorizontal } from 'lucide-react'
import { manageRoomMember } from '@/actions/rooms'
import { canManageRoom, memberActionError, type MemberAction } from '@/lib/room-permissions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useClock } from '@/hooks/use-clock'

export interface RoomParticipant { id: string; username: string; role: string; status: string; lastSeenAt: string | null }

export function MemberList({ members, roomId, currentUserId, role, onChange }: { members: RoomParticipant[]; roomId: string; currentUserId: string; role: string; onChange: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<MemberAction | null>(null)
  const [pending, startTransition] = useTransition()
  const now = useClock(true)
  const isOnline = (member: RoomParticipant) => member.status === 'active' && now > 0 && !!member.lastSeenAt && new Date(member.lastSeenAt).getTime() >= now - 60_000
  const target = members.find(m => m.id === selected)
  const actions: { action: MemberAction; label: string }[] = target?.status === 'pending'
    ? [{ action: 'approve', label: 'Approve request' }, { action: 'reject', label: 'Reject request' }]
    : target?.status === 'banned' ? [{ action: 'unban', label: 'Lift ban' }]
    : [{ action: target?.role === 'admin' ? 'demote' : 'promote', label: target?.role === 'admin' ? 'Demote to Member' : 'Promote to Admin' }, { action: 'kick', label: 'Kick' }, { action: 'ban', label: 'Ban' }, { action: 'transfer', label: 'Transfer ownership' }]
  const run = (action: MemberAction) => startTransition(async () => {
    if (!target) return
    try {
      const result = await manageRoomMember(roomId, target.id, action)
      if (result.error) toast.error(result.error)
      else { setSelected(null); setConfirm(null); onChange(); toast.success('Member updated') }
    } catch { toast.error('Unable to update member. Your permissions may have changed.') }
  })
  return <div>
    <h2 className="mb-3 text-sm font-semibold">Members <span className="font-normal text-muted-foreground">· {members.filter(isOnline).length} online</span></h2>
    <ul className="space-y-2">{members.map(member => <li key={member.id} className="flex items-center gap-2 rounded-lg p-2">
      {member.role === 'owner' ? <Crown aria-label="Owner" className="h-4 w-4 shrink-0 text-amber-500" /> : member.role === 'admin' ? <Shield aria-label="Admin" className="h-4 w-4 shrink-0 text-accent-primary" /> : null}
      <div className="min-w-0 flex-1"><p className="truncate text-sm">{member.username}{member.id === currentUserId ? ' (You)' : ''}</p><p className="text-xs text-muted-foreground">{member.status === 'active' ? member.role : member.status}{isOnline(member) ? ' · Online' : ''}</p></div>
      {canManageRoom(role) && member.id !== currentUserId && member.role !== 'owner' && <Button size="icon" variant="ghost" aria-label={`Manage ${member.username}`} onClick={() => { setSelected(member.id); setConfirm(null) }}><MoreHorizontal className="h-4 w-4" /></Button>}
    </li>)}</ul>
    <Dialog open={!!target} onOpenChange={open => { if (!open) setSelected(null) }}><DialogContent onClose={() => setSelected(null)}>
      <DialogHeader><DialogTitle>Manage {target?.username}</DialogTitle></DialogHeader>
      {confirm ? <div className="space-y-3"><p>Confirm {confirm === 'transfer' ? 'transferring ownership to' : `${confirm} for`} {target?.username}?{confirm === 'transfer' && ' You will become an admin.'}</p><Button disabled={pending} onClick={() => run(confirm)}>Confirm</Button><Button variant="ghost" disabled={pending} onClick={() => setConfirm(null)}>Cancel</Button></div>
        : <div className="flex flex-col gap-2">{actions.filter(a => target && !memberActionError(role, target.role, target.id === currentUserId, a.action)).map(a => <Button key={a.action} variant="outline" disabled={pending} onClick={() => ['kick', 'ban', 'transfer'].includes(a.action) ? setConfirm(a.action) : run(a.action)}>{a.label}</Button>)}</div>}
    </DialogContent></Dialog>
  </div>
}
