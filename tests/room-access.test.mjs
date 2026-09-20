import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './load-source.mjs'

const { memberActionError } = loadSource('src/lib/room-permissions.ts')

test('members cannot manage roles; admins cannot kick, ban, demote or transfer the owner', () => {
  for (const action of ['promote', 'demote', 'kick', 'ban', 'transfer']) {
    assert.ok(memberActionError('member', 'member', false, action))
    assert.ok(memberActionError('admin', 'owner', false, action))
    assert.ok(memberActionError('owner', 'member', true, action))
  }
  assert.equal(memberActionError('admin', 'admin', false, 'demote'), null)
  assert.equal(memberActionError('owner', 'admin', false, 'demote'), null)
  assert.equal(memberActionError('admin', 'member', false, 'promote'), null)
})

function harness({ actor = 'owner', actorStatus = 'active', targetRole = 'member', targetStatus = 'active', isPublic = true } = {}) {
  const room = { id: 'room', code: 'INVITE', ownerId: actor === 'owner' ? 'me' : 'creator', isPublic }
  const members = new Map([
    ['me', { id: 'membership', roomId: 'room', profileId: 'me', role: actor, status: actorStatus }],
    ['target', { id: 'target-membership', roomId: 'room', profileId: 'target', role: targetRole, status: targetStatus }],
    ['creator', { id: 'creator-membership', roomId: 'room', profileId: 'creator', role: 'owner', status: 'active' }],
  ])
  let writes = 0
  const tx = {
    $queryRaw: async () => [],
    room: {
      findUnique: async () => room,
      findUniqueOrThrow: async () => room,
      update: async ({ data }) => { writes++; Object.assign(room, data); return room },
      delete: async () => { writes++; return room },
    },
    roomMember: {
      findUnique: async ({ where }) => members.get(where.roomId_profileId.profileId),
      update: async ({ where, data }) => {
        writes++
        const member = where.id ? [...members.values()].find(m => m.id === where.id) : members.get(where.roomId_profileId.profileId)
        Object.assign(member, data)
        return member
      },
      upsert: async ({ where, create, update }) => {
        writes++
        const id = where.roomId_profileId.profileId
        if (members.has(id)) Object.assign(members.get(id), update)
        else members.set(id, create)
      },
    },
  }
  const prisma = { ...tx, $transaction: fn => fn(tx) }
  const overrides = { '@/lib/auth-profile': { getAuthProfile: async () => ({ id: 'me' }) }, '@/lib/prisma': { prisma }, 'next/cache': { revalidatePath: () => {} } }
  return { actions: loadSource('src/actions/rooms.ts', overrides), overrides, members, room, tx, writes: () => writes }
}

test('all room management server actions enforce member authorization before writes', async () => {
  const h = harness({ actor: 'member' })
  await assert.rejects(h.actions.updateRoomSettings('room', { name: 'Changed', isPublic: false }), /permission/)
  await assert.rejects(h.actions.manageRoomMember('room', 'target', 'promote'), /permission/)
  await assert.rejects(h.actions.deleteRoom('room'), /permission/)
  assert.equal(h.writes(), 0)
})

test('admins can update visibility, but cannot delete or transfer ownership', async () => {
  const h = harness({ actor: 'admin' })
  await h.actions.updateRoomSettings('room', { name: 'Changed', isPublic: false })
  assert.equal(h.room.isPublic, false)
  assert.ok((await h.actions.deleteRoom('room')).error)
  assert.ok((await h.actions.manageRoomMember('room', 'target', 'transfer')).error)
})

test('ownership transfer updates the room and both member roles', async () => {
  const h = harness()
  assert.equal((await h.actions.manageRoomMember('room', 'target', 'transfer')).success, true)
  assert.equal(h.room.ownerId, 'target')
  assert.equal(h.members.get('target').role, 'owner')
  assert.equal(h.members.get('me').role, 'admin')
})

test('owner cannot leave without transferring ownership', async () => {
  const h = harness()
  assert.ok((await h.actions.leaveRoom('room')).error)
  assert.equal(h.writes(), 0)
})

test('stale discovery join is rejected after public room becomes private', async () => {
  const h = harness({ isPublic: false })
  assert.ok((await h.actions.joinPublicRoom('room')).error)
  assert.equal(h.writes(), 0)
})

test('private invitation works, but banned users cannot rejoin by code or discovery', async () => {
  const data = new FormData(); data.set('code', 'invite')
  const invited = harness({ actor: 'member', actorStatus: 'kicked', isPublic: false })
  assert.ok((await invited.actions.joinRoom(data)).room)
  assert.equal(invited.members.get('me').status, 'active')
  const banned = harness({ actor: 'member', actorStatus: 'banned' })
  assert.ok((await banned.actions.joinRoom(data)).error)
  assert.ok((await banned.actions.joinPublicRoom('room')).error)
  assert.equal(banned.writes(), 0)
})

test('pending private requests can be approved only by room managers', async () => {
  const h = harness({ actor: 'admin', targetStatus: 'pending' })
  assert.equal((await h.actions.manageRoomMember('room', 'target', 'approve')).success, true)
  assert.equal(h.members.get('target').status, 'active')
  assert.ok((await h.actions.manageRoomMember('room', 'target', 'approve')).error)
})

test('kick and ban revoke existing membership authorization', async () => {
  for (const action of ['kick', 'ban']) {
    const h = harness()
    assert.equal((await h.actions.manageRoomMember('room', 'target', action)).success, true)
    const { requireRoomRole } = loadSource('src/lib/room-access.ts', h.overrides)
    await assert.rejects(requireRoomRole('room', 'target'), /permission/)
  }
})

test('settings reject empty names, non-boolean visibility, oversized tags and invalid timer lengths', async () => {
  const h = harness()
  for (const invalid of [{ name: '' }, { isPublic: 'false' }, { tags: ['a'.repeat(25)] }, { tags: Array(9).fill('a') }, { focusDuration: -1 }, { restDuration: NaN }, { description: 'a'.repeat(501) }]) {
    assert.ok((await h.actions.updateRoomSettings('room', { name: 'Room', isPublic: true, ...invalid })).error)
  }
  assert.equal(h.writes(), 0)
})

test('start, pause, resume and stop enforce room manager role on the server', async () => {
  for (const actor of ['member', 'admin']) {
    const h = harness({ actor, actorStatus: actor === 'admin' ? 'banned' : 'active' })
    h.overrides['@/lib/prisma'].prisma.timer = { findUnique: async () => ({ id: 'timer', roomId: 'room', status: 'running' }) }
    const timers = loadSource('src/actions/timer.ts', h.overrides)
    await assert.rejects(timers.startTimer('room', 1500), /permission/)
    for (const action of ['pauseTimer', 'resumeTimer', 'stopTimer']) await assert.rejects(timers[action]('timer'), /permission/)
    assert.equal(h.writes(), 0)
  }
})

test('stopping a room timer twice cannot credit it twice and credits its starter', async () => {
  const h = harness({ actor: 'admin' })
  const timer = { id: 'timer', roomId: 'room', userId: 'creator', status: 'paused', elapsed: 2000, mode: 'countdown', duration: 1500 }
  const timerDb = { findUnique: async () => timer, update: async ({ data }) => Object.assign(timer, data) }
  h.tx.timer = timerDb
  h.overrides['@/lib/prisma'].prisma.timer = timerDb
  const credits = []
  h.overrides['@/lib/record-focus'] = { recordFocus: async (_tx, profile, duration) => credits.push([profile, duration]) }
  const timers = loadSource('src/actions/timer.ts', h.overrides)
  await timers.stopTimer('timer')
  await timers.stopTimer('timer')
  assert.deepEqual(credits, [['creator', 1500]])
})
