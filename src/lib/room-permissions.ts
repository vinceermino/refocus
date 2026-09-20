export function canManageRoom(role: string | null | undefined) {
  return role === 'owner' || role === 'admin'
}

export type MemberAction = 'promote' | 'demote' | 'kick' | 'ban' | 'approve' | 'reject' | 'transfer' | 'unban'

export function memberActionError(actorRole: string, targetRole: string, self: boolean, action: MemberAction) {
  if (!canManageRoom(actorRole)) return 'Only owners and admins can manage members.'
  if (self) return 'You cannot perform this action on yourself.'
  if (targetRole === 'owner') return 'The owner cannot be demoted, kicked, or banned.'
  if (action === 'transfer' && actorRole !== 'owner') return 'Only the owner can transfer ownership.'
  return null
}
