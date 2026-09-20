import { prisma } from '@/lib/prisma'

export async function discoverRooms(search: string, page = 0) {
  const query = search.trim().slice(0, 80)
  const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
  // Never return invitation codes in discovery. A stale card cannot be used
  // to bypass a subsequent change to private visibility.
  const rooms = await prisma.$queryRaw<{ id: string; name: string; description: string; tags: string[]; activeUsers: number }[]>`
    SELECT r.id, r.name, r.description, r.tags,
      (SELECT COUNT(*)::integer FROM room_members m WHERE m.room_id = r.id
        AND m.status = 'active' AND m.last_seen_at >= ${new Date(Date.now() - 60_000)}) AS "activeUsers"
    FROM rooms r
    WHERE r.is_public = true AND (r.name ILIKE ${pattern}
      OR EXISTS (SELECT 1 FROM unnest(r.tags) tag WHERE tag ILIKE ${pattern}))
    ORDER BY r.created_at DESC, r.id DESC LIMIT 25 OFFSET ${page * 24}
  `
  return rooms.map(({ activeUsers, ...room }) => ({ ...room, _count: { members: activeUsers } }))
}
