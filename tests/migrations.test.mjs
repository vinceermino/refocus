import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { loadSource } from './load-source.mjs'

const baseline = fs.readFileSync('prisma/migrations/00000000000000_baseline/migration.sql', 'utf8')
const feature = fs.readFileSync('prisma/migrations/20260920000000_focus_goals_room_controls/migration.sql', 'utf8')
const owner = '00000000-0000-4000-8000-000000000001'
const member = '00000000-0000-4000-8000-000000000002'
const room = '00000000-0000-4000-8000-000000000003'
const timer = '00000000-0000-4000-8000-000000000004'

test('PostgreSQL migrations support existing data, preserve history and block Data API access', async t => {
  const db = await PGlite.create()
  t.after(() => db.close())
  await db.exec("SET TIME ZONE 'UTC'")
  await db.exec(baseline)
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    INSERT INTO profiles (id, user_id, username, updated_at)
    VALUES ('${owner}', 'owner-auth', 'owner', now()), ('${member}', 'member-auth', 'member', now());
    INSERT INTO rooms (id, name, code, owner_id, updated_at) VALUES ('${room}', 'Math', 'INVITE', '${owner}', now());
    INSERT INTO timers (id, room_id, user_id, updated_at) VALUES ('${timer}', '${room}', '${owner}', now());
    INSERT INTO timer_sessions (id, timer_id, profile_id, duration, started_at, ended_at, created_at)
    VALUES (gen_random_uuid(), '${timer}', '${owner}', 3600, '2026-09-19 10:00', '2026-09-19 11:00', '2026-09-19 11:00'),
      (gen_random_uuid(), '${timer}', '${owner}', 3600, '2026-09-19 12:00', '2026-09-19 13:00', '2026-09-19 13:00'),
      (gen_random_uuid(), '${timer}', '${owner}', 1800, '2026-09-20 00:00', '2026-09-20 00:30', '2026-09-20 00:30');
  `)
  await db.exec(feature)

  await t.test('historical focus is grouped by recorded UTC day and gets a default goal', async () => {
    const { rows } = await db.query('SELECT day::text, goal_minutes, focus_seconds FROM daily_stats ORDER BY day')
    assert.deepEqual(rows, [
      { day: '2026-09-19', goal_minutes: 120, focus_seconds: 7200 },
      { day: '2026-09-20', goal_minutes: 120, focus_seconds: 1800 },
    ])
  })

  await t.test('legacy missing owner membership is repaired', async () => {
    const { rows } = await db.query('SELECT role, status FROM room_members WHERE profile_id = $1', [owner])
    assert.deepEqual(rows, [{ role: 'owner', status: 'active' }])
  })

  await t.test('database rejects invalid goals, roles and a second owner', async () => {
    await assert.rejects(db.query('UPDATE daily_stats SET goal_minutes = 0'), /daily_stats_goal_check/)
    await assert.rejects(db.query("UPDATE room_members SET role = 'superadmin'"), /room_members_role_check/)
    await assert.rejects(db.query("INSERT INTO room_members (id, room_id, profile_id, role) VALUES (gen_random_uuid(), $1, $2, 'owner')", [room, member]), /room_members_one_owner_idx/)
  })

  await t.test('discovery searches partial tags, counts active users and immediately excludes private rooms', async () => {
    const { discoverRooms } = loadSource('src/lib/discovery.ts', {
      '@/lib/prisma': { prisma: { $queryRaw: async (strings, ...values) => {
        const sql = strings.reduce((query, part, i) => query + part + (i < values.length ? `$${i + 1}` : ''), '')
        return (await db.query(sql, values)).rows
      } } },
    })
    await db.query("UPDATE rooms SET tags = ARRAY['calculus', 'quiet study']")
    await db.query('UPDATE room_members SET last_seen_at = now()')
    const result = await discoverRooms('CALC')
    assert.equal(result.length, 1)
    assert.equal(result[0]._count.members, 1)
    assert.equal(Object.hasOwn(result[0], 'code'), false)
    assert.equal((await discoverRooms('%')).length, 0)
    assert.equal((await discoverRooms("' OR true --")).length, 0)
    await db.query('UPDATE rooms SET is_public = false')
    assert.equal((await discoverRooms('Math')).length, 0)
    await db.query('UPDATE rooms SET is_public = true')
    await db.query("UPDATE room_members SET last_seen_at = now() - interval '2 minutes'")
    assert.equal((await discoverRooms('Math'))[0]._count.members, 0)
  })

  await t.test('failed ownership change rolls back, valid transfer keeps one owner', async () => {
    await db.query("INSERT INTO room_members (id, room_id, profile_id) VALUES (gen_random_uuid(), $1, $2)", [room, member])
    await assert.rejects(db.transaction(async tx => {
      await tx.query("UPDATE room_members SET role = 'admin' WHERE profile_id = $1", [owner])
      await tx.query('UPDATE rooms SET owner_id = $1', ['00000000-0000-4000-8000-000000000099'])
    }))
    assert.equal((await db.query('SELECT owner_id FROM rooms')).rows[0].owner_id, owner)
    await db.transaction(async tx => {
      await tx.query('UPDATE rooms SET owner_id = $1', [member])
      await tx.query("UPDATE room_members SET role = 'admin' WHERE profile_id = $1", [owner])
      await tx.query("UPDATE room_members SET role = 'owner' WHERE profile_id = $1", [member])
    })
    assert.equal((await db.query("SELECT count(*)::int AS count FROM room_members WHERE role = 'owner'")).rows[0].count, 1)
  })

  await t.test('RLS is enabled on every app table, and anon/authenticated grants are revoked', async () => {
    const { rows } = await db.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('profiles', 'rooms', 'room_members', 'timers', 'timer_sessions', 'daily_stats')")
    assert.equal(rows.length, 6)
    assert.ok(rows.every(r => r.relrowsecurity))
    for (const role of ['anon', 'authenticated']) {
      for (const table of rows.map(r => r.relname)) {
        assert.equal((await db.query("SELECT has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE') AS allowed", [role, table])).rows[0].allowed, false)
      }
    }
  })

  await t.test('deleting a room retains sessions and daily goal history', async () => {
    await db.query('DELETE FROM rooms WHERE id = $1', [room])
    const { rows } = await db.query('SELECT timer_id FROM timer_sessions')
    assert.equal(rows.length, 3)
    assert.ok(rows.every(r => r.timer_id === null))
    assert.equal((await db.query('SELECT count(*)::int AS count FROM daily_stats')).rows[0].count, 2)
  })
})

test('migrations also apply to a fresh database without Supabase roles', async t => {
  const db = await PGlite.create()
  t.after(() => db.close())
  await db.exec(baseline)
  await db.exec(feature)
  assert.equal((await db.query('SELECT count(*)::int AS count FROM daily_stats')).rows[0].count, 0)
})
