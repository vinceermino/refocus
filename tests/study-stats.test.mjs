import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { loadSource } from './load-source.mjs'

const emptyTotal = { _sum: { duration: null }, _count: 0, _avg: { duration: null } }
const plain = value => JSON.parse(JSON.stringify(value))

test('study statistics start independent reads together and retain UTC goals, streaks and weekly gaps', async () => {
  const started = []
  const resolve = {}
  const pending = name => {
    started.push(name)
    return new Promise(done => { resolve[name] = done })
  }
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-09-24T21:00:00Z'])) }
  }
  const { loadStudyStats } = loadSource('src/lib/study-stats.ts', {
    globals: { Date: FixedDate },
    '@/lib/prisma': { prisma: {
      dailyStat: { findMany: args => {
        assert.equal(args.where.profileId, 'me')
        assert.equal(args.where.day.lte.toISOString(), '2026-09-24T00:00:00.000Z')
        return pending('days')
      } },
      timerSession: { aggregate: args => {
        assert.equal(args.where.profileId, 'me')
        return pending('total')
      } },
      $queryRaw: () => pending('rooms'),
    } },
  })
  const result = loadStudyStats('me')
  assert.deepEqual(started, ['days', 'total', 'rooms'])
  resolve.days([
    { day: new Date('2026-09-22T00:00:00Z'), focusSeconds: 3600, goalMinutes: 60 },
    { day: new Date('2026-09-23T00:00:00Z'), focusSeconds: 7200, goalMinutes: 120 },
    { day: new Date('2026-09-24T00:00:00Z'), focusSeconds: 900, goalMinutes: 60 },
  ])
  resolve.total({ _sum: { duration: 11700 }, _count: 4, _avg: { duration: 2925 } })
  resolve.rooms([{ roomName: 'Math', seconds: 11700 }])
  const stats = await result
  assert.equal(stats.today, '2026-09-24')
  assert.equal(stats.todaySeconds, 900)
  assert.equal(stats.goalMinutes, 60)
  assert.equal(stats.currentStreak, 2)
  assert.equal(stats.longestStreak, 2)
  assert.equal(stats.totalSeconds, 11700)
  assert.equal(stats.totalSessions, 4)
  assert.equal(stats.averageSessionSeconds, 2925)
  assert.equal(stats.weeklyData[0].fullDate, '2026-09-18')
  assert.deepEqual(plain(stats.weeklyData.map(day => day.seconds)), [0, 0, 0, 0, 3600, 7200, 900])
  assert.deepEqual(plain(stats.roomBreakdown), [{ roomName: 'Math', seconds: 11700, color: '#6366f1' }])
})

test('room breakdown aggregates and bounds historical sessions in PostgreSQL', async t => {
  const db = await PGlite.create()
  t.after(() => db.close())
  await db.exec(fs.readFileSync('prisma/migrations/00000000000000_baseline/migration.sql', 'utf8'))
  await db.exec(fs.readFileSync('prisma/migrations/20260920000000_focus_goals_room_controls/migration.sql', 'utf8'))
  const me = randomUUID()
  const other = randomUUID()
  await db.query(`INSERT INTO profiles (id, user_id, username, updated_at)
    VALUES ($1, 'me-auth', 'me', now()), ($2, 'other-auth', 'other', now())`, [me, other])

  async function createRoom(name) {
    const roomId = randomUUID()
    const timerId = randomUUID()
    await db.query(`INSERT INTO rooms (id, name, code, owner_id, updated_at)
      VALUES ($1::uuid, $2, $1::text, $3, now())`, [roomId, name, me])
    await db.query(`INSERT INTO timers (id, room_id, user_id, updated_at)
      VALUES ($1, $2, $3, now())`, [timerId, roomId, me])
    return { roomId, timerId }
  }
  async function session(timerId, duration, profileId = me) {
    await db.query(`INSERT INTO timer_sessions (id, timer_id, profile_id, duration, started_at, ended_at)
      VALUES ($1, $2, $3, $4, now(), now())`, [randomUUID(), timerId, profileId, duration])
  }

  const { loadStudyStats } = loadSource('src/lib/study-stats.ts', {
    '@/lib/prisma': { prisma: {
      dailyStat: { findMany: async () => [] },
      timerSession: { aggregate: async () => emptyTotal },
      $queryRaw: async (strings, ...values) => {
        const sql = strings.reduce((query, part, i) => query + part + (i < values.length ? `$${i + 1}` : ''), '')
        return (await db.query(sql, values)).rows
      },
    } },
  })
  const breakdown = async () => plain((await loadStudyStats(me)).roomBreakdown.map(({ roomName, seconds }) => ({ roomName, seconds })))

  await t.test('empty history has zero totals, a default goal and a complete empty week', async () => {
    const stats = await loadStudyStats(me)
    assert.equal(stats.totalSeconds, 0)
    assert.equal(stats.totalSessions, 0)
    assert.equal(stats.averageSessionSeconds, 0)
    assert.equal(stats.goalMinutes, 120)
    assert.equal(stats.currentStreak, 0)
    assert.equal(stats.longestStreak, 0)
    assert.equal(stats.weeklyData.length, 7)
    assert.ok(stats.weeklyData.every(day => day.seconds === 0))
    assert.deepEqual(plain(stats.roomBreakdown), [])
  })

  const first = await createRoom('Shared name')
  const second = await createRoom('Shared name')
  const personal = await createRoom('Personal')
  const alpha = await createRoom('Alpha')
  await session(first.timerId, 1000)
  await session(second.timerId, 2000)
  await session(null, 700)
  await session(personal.timerId, 300)
  await session(alpha.timerId, 500)
  await session(first.timerId, 90000, other)

  await t.test('same names and Personal labels merge without another profile leaking into totals', async () => {
    assert.deepEqual(await breakdown(), [
      { roomName: 'Shared name', seconds: 3000 },
      { roomName: 'Personal', seconds: 1000 },
      { roomName: 'Alpha', seconds: 500 },
    ])
  })

  await t.test('deleted rooms retain sessions in Personal and equal totals have stable ordering', async () => {
    await db.query('DELETE FROM rooms WHERE id = $1', [first.roomId])
    assert.deepEqual(await breakdown(), [
      { roomName: 'Personal', seconds: 2000 },
      { roomName: 'Shared name', seconds: 2000 },
      { roomName: 'Alpha', seconds: 500 },
    ])
  })

  await t.test('only the ten highest room totals are returned', async () => {
    for (let i = 1; i <= 12; i++) {
      const room = await createRoom(`Room ${i}`)
      await session(room.timerId, i * 10)
    }
    const rooms = await breakdown()
    assert.equal(rooms.length, 10)
    assert.deepEqual(rooms.slice(3).map(room => room.seconds), [120, 110, 100, 90, 80, 70, 60])
  })

  await t.test('aggregate seconds remain JSON-safe above the PostgreSQL integer range', async () => {
    await session(null, 2147483647)
    await session(null, 2147483647)
    const rooms = await breakdown()
    assert.equal(rooms[0].seconds, 4294969294)
    assert.equal(typeof rooms[0].seconds, 'number')
  })

  await t.test('profile input is bound as a UUID parameter', async () => {
    await assert.rejects(loadStudyStats(`${me}' OR true --`), /invalid input syntax for type uuid/)
  })
})
