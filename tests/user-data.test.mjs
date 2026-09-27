import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './load-source.mjs'

const plain = value => JSON.parse(JSON.stringify(value))

test('user data does not query private data before authentication', async () => {
  const { getUserData } = loadSource('src/lib/actions/user-data.ts', {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
    '@/lib/prisma': { prisma: {} },
    '@/lib/study-stats': { loadStudyStats: () => assert.fail('Must authenticate before loading statistics') },
  })
  assert.deepEqual(plain(await getUserData()), { error: 'Not authenticated', status: 401 })
})

test('a missing profile cannot trigger room or statistics queries', async () => {
  const { getUserData } = loadSource('src/lib/actions/user-data.ts', {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'auth-user' } } }) } }) },
    '@/lib/prisma': { prisma: { profile: { findUnique: async args => {
      assert.equal(args.where.userId, 'auth-user')
      return null
    } } } },
    '@/lib/study-stats': { loadStudyStats: () => assert.fail('Must resolve the profile before loading statistics') },
  })
  assert.deepEqual(plain(await getUserData()), { error: 'Profile not found', status: 404 })
})

test('user data loads rooms and statistics concurrently with only dashboard fields', async () => {
  const profile = { id: 'profile-id', username: 'Ada', genderPref: 'neutral', totalStudyTime: 1200 }
  const room = { id: 'room-id', name: 'Math', code: 'INVITE', _count: { members: 2 }, timers: [{ status: 'paused', mode: 'stopwatch' }] }
  const started = []
  let finishRooms
  let roomQuery
  let profileQuery
  const { getUserData } = loadSource('src/lib/actions/user-data.ts', {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'auth-user' } } }) } }) },
    '@/lib/prisma': { prisma: {
      profile: { findUnique: async args => { profileQuery = args; return profile } },
      roomMember: { findMany: args => {
        roomQuery = args
        started.push('rooms')
        return new Promise(done => { finishRooms = done })
      } },
    } },
    '@/lib/study-stats': { loadStudyStats: async id => {
      assert.equal(id, profile.id)
      started.push('stats')
      return { todaySeconds: 1200 }
    } },
  })
  const result = getUserData()
  // Let auth and profile resolve while the rooms request remains pending.
  await new Promise(done => setImmediate(done))
  assert.deepEqual(started, ['rooms', 'stats'])
  assert.deepEqual(plain(profileQuery), {
    where: { userId: 'auth-user' },
    select: { id: true, username: true, genderPref: true, totalStudyTime: true },
  })
  assert.deepEqual(plain(roomQuery.where), { profileId: profile.id, status: 'active' })
  const selectedRoom = roomQuery.select.room.select
  assert.deepEqual(Object.keys(selectedRoom).sort(), ['_count', 'code', 'id', 'name', 'timers'])
  assert.deepEqual(plain(selectedRoom._count.select.members.where), { status: 'active' })
  assert.deepEqual(plain(selectedRoom.timers), {
    where: { status: { in: ['running', 'paused'] } },
    select: { status: true, mode: true },
    take: 1, orderBy: { createdAt: 'desc' },
  })
  finishRooms([{ room }])
  assert.deepEqual(plain(await result), { data: { profile, rooms: [room], stats: { todaySeconds: 1200 } } })
})
