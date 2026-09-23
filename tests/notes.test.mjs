import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadSource } from './load-source.mjs'

const me = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const outsider = '00000000-0000-4000-8000-000000000003'
const roomId = '00000000-0000-4000-8000-000000000004'
const validation = loadSource('src/lib/note-validation.ts')

// Evaluate the Prisma predicates against fixtures so a missing privacy predicate
// fails the test, rather than returning a pre-filtered mock response.
function matches(row, where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(condition => matches(row, condition))
    if (value && typeof value === 'object') {
      if ('some' in value) return row[key].some(item => matches(item, value.some))
      return matches(row[key], value)
    }
    return row[key] === value
  })
}
function pick(row, select) {
  if (!row) return null
  if (!select) return { ...row }
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key, value]) => [key, typeof value === 'object' ? pick(row[key], value.select) : row[key]]))
}

function harness() {
  let actor = me
  let index = 10
  let time = Date.parse('2026-09-23T09:00:00Z')
  const profiles = [me, other, outsider].map((id, i) => ({ id, userId: `secret-auth-${i}`, username: `Student ${i}`, profileNote: '', createdAt: new Date(time) }))
  const room = { id: roomId, name: 'Study room', code: 'SECRET', ownerId: other }
  const members = [me, other].map(profileId => ({ profileId, roomId, status: 'active', role: profileId === other ? 'owner' : 'member', joinedAt: new Date(time) }))
  const notes = []
  const fullRoom = () => ({ ...room, members })
  const fullNote = note => note && ({ ...note, author: pick(profiles.find(p => p.id === note.authorId), { id: true, username: true }), groupStudy: fullRoom() })
  const ordered = (rows, orderBy) => [...rows].sort((a, b) => {
    for (const entry of orderBy ?? []) {
      const [key, direction] = Object.entries(entry)[0]
      if (a[key] < b[key]) return direction === 'desc' ? 1 : -1
      if (a[key] > b[key]) return direction === 'desc' ? -1 : 1
    }
    return 0
  })
  const tx = {
    $queryRaw: async () => [],
    room: { findUnique: async () => room },
    roomMember: {
      findUnique: async ({ where }) => members.find(m => m.profileId === where.roomId_profileId.profileId),
      findMany: async ({ where, select }) => members.map(m => ({ ...m, room: fullRoom() })).filter(m => matches(m, where)).map(m => pick(m, select)),
    },
    profile: {
      findUnique: async ({ where, select }) => pick(profiles.find(p => p.id === where.id), select),
      update: async ({ where, data, select }) => {
        const profile = profiles.find(p => p.id === where.id)
        Object.assign(profile, data)
        return pick(profile, select)
      },
    },
    groupStudyNote: {
      findUnique: async ({ where, select }) => pick(notes.find(n => n.id === where.id), select),
      findMany: async ({ where, orderBy, take }) => ordered(notes.map(fullNote).filter(n => matches(n, where)), orderBy).slice(0, take),
      create: async ({ data }) => {
        const stamp = new Date(time += 1000)
        const note = { id: `00000000-0000-4000-8000-${String(index++).padStart(12, '0')}`, ...data, createdAt: stamp, updatedAt: stamp }
        notes.push(note)
        return fullNote(note)
      },
      update: async ({ where, data }) => {
        const note = notes.find(n => n.id === where.id)
        Object.assign(note, data, { updatedAt: new Date(time += 1000) })
        return fullNote(note)
      },
      delete: async ({ where }) => notes.splice(notes.findIndex(n => n.id === where.id), 1)[0],
    },
  }
  class AuthenticationError extends Error {}
  const overrides = {
    '@/lib/note-validation': validation,
    '@/lib/prisma': { prisma: { ...tx, $transaction: fn => fn(tx) } },
    '@/lib/auth-profile': { AuthenticationError, getAuthProfile: async () => {
      if (!actor) throw new AuthenticationError('Not authenticated')
      return profiles.find(p => p.id === actor)
    } },
    'next/navigation': { unstable_rethrow: () => {} },
    globals: { URL },
  }
  const services = loadSource('src/lib/notes.ts', overrides)
  const routes = {
    group: loadSource('src/app/api/group-study/[id]/notes/route.ts', overrides),
    note: loadSource('src/app/api/notes/[id]/route.ts', overrides),
    user: loadSource('src/app/api/users/[id]/route.ts', overrides),
    profileNote: loadSource('src/app/api/users/[id]/profile-note/route.ts', overrides),
  }
  const call = (route, method, id, body, origin = 'http://localhost') => routes[route][method](new Request(`http://localhost/api/test/${id}`, {
    method, headers: { origin }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }), { params: Promise.resolve({ id }) })
  return { services, call, notes, members, actor: id => { actor = id } }
}

test('group note APIs persist across reads, default to personal, sort newest first and update/delete', async () => {
  const h = harness()
  const first = await h.call('group', 'POST', roomId, { content: '  First note  ', authorId: other })
  assert.equal(first.status, 201)
  const { note } = await first.json()
  assert.equal(note.authorId, me)
  assert.equal(note.groupStudyId, roomId)
  assert.equal(note.visibility, 'personal')
  assert.equal(note.content, 'First note')
  assert.ok(note.createdAt && note.updatedAt)
  const second = (await (await h.call('group', 'POST', roomId, { content: 'Shared note', visibility: 'group' })).json()).note
  const list = await h.call('group', 'GET', roomId)
  assert.equal(list.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual((await list.json()).notes.map(n => n.id), [second.id, note.id])
  const updated = await h.call('note', 'PATCH', note.id, { content: 'Changed', visibility: 'group', authorId: other })
  const changed = (await updated.json()).note
  assert.equal(changed.content, 'Changed')
  assert.equal(changed.authorId, me)
  assert.equal(changed.visibility, 'group')
  assert.notEqual(changed.updatedAt, note.updatedAt)
  assert.equal((await h.call('note', 'DELETE', note.id)).status, 200)
  assert.deepEqual((await (await h.call('group', 'GET', roomId)).json()).notes.map(n => n.id), [second.id])
})

test('personal notes stay private and room owners cannot edit or delete another author’s notes', async () => {
  const h = harness()
  const personal = await h.services.createGroupNote(roomId, me, { content: 'Private' })
  const shared = await h.services.createGroupNote(roomId, me, { content: 'Group', visibility: 'group' })
  h.actor(other)
  assert.deepEqual((await (await h.call('group', 'GET', roomId)).json()).notes.map(n => n.id), [shared.id])
  for (const id of [personal.id, shared.id]) {
    assert.equal((await h.call('note', 'PATCH', id, { content: 'Not mine' })).status, 404)
    assert.equal((await h.call('note', 'DELETE', id)).status, 404)
  }
  assert.equal(h.notes.length, 2)
})

test('pending, kicked, banned and nonmembers cannot read or mutate room notes', async () => {
  const h = harness()
  const note = await h.services.createGroupNote(roomId, me, { content: 'Mine' })
  for (const status of ['pending', 'kicked', 'banned']) {
    h.members[0].status = status
    assert.equal((await h.call('group', 'GET', roomId)).status, 403)
    assert.equal((await h.call('group', 'POST', roomId, { content: 'Blocked' })).status, 403)
    assert.equal((await h.call('note', 'PATCH', note.id, { content: 'Blocked' })).status, 403)
    assert.equal((await h.call('note', 'DELETE', note.id)).status, 403)
  }
  h.actor(outsider)
  assert.equal((await h.call('group', 'GET', roomId)).status, 403)
  assert.equal((await h.call('group', 'POST', roomId, { content: 'Blocked' })).status, 403)
})

test('API validation rejects empty/oversized notes, bad JSON, visibility, IDs and cross-origin writes', async () => {
  const h = harness()
  for (const content of ['', ' \n\t ', 'x'.repeat(501), 123, null]) {
    assert.equal((await h.call('group', 'POST', roomId, { content })).status, 400)
  }
  assert.equal((await h.call('group', 'POST', roomId, { content: 'Valid', visibility: 'public' })).status, 400)
  for (const body of ['{', 'null', '[]']) assert.equal((await h.call('group', 'POST', roomId, body)).status, 400)
  assert.equal((await h.call('group', 'GET', 'bad-id')).status, 400)
  assert.equal((await h.call('group', 'POST', roomId, { content: 'Valid' }, 'https://attacker.example')).status, 403)
  assert.equal((await h.call('group', 'POST', roomId, { content: 'x'.repeat(500) })).status, 201)
  assert.equal((await h.call('group', 'POST', roomId, 'x'.repeat(8193))).status, 413)
  h.actor(null)
  assert.equal((await h.call('group', 'GET', roomId)).status, 401)
  assert.equal((await h.call('group', 'POST', roomId, { content: 'No session' })).status, 401)
  assert.equal((await h.call('profileNote', 'PATCH', me, { profileNote: 'No session' })).status, 401)
})

test('profile notes are public, owner editable and deletable without exposing private room data', async () => {
  const h = harness()
  await h.services.createGroupNote(roomId, me, { content: 'Private' })
  await h.services.createGroupNote(roomId, me, { content: 'Shared', visibility: 'group' })
  assert.equal((await h.call('profileNote', 'PATCH', me, { profileNote: 'x'.repeat(301) })).status, 400)
  assert.equal((await h.call('profileNote', 'PATCH', me, { profileNote: 'x'.repeat(300) })).status, 200)
  await h.call('profileNote', 'PATCH', me, { profileNote: '<b>Plain text</b>' })
  assert.equal((await h.services.getPublicProfile(me, me)).notes.length, 2)
  h.actor(other)
  assert.equal((await h.call('profileNote', 'PATCH', me, { profileNote: 'Not mine' })).status, 403)
  const peer = (await (await h.call('user', 'GET', me)).json()).profile
  assert.equal(peer.profileNote, '<b>Plain text</b>')
  assert.equal(peer.isOwner, false)
  assert.deepEqual(peer.notes.map(n => n.content), ['Shared'])
  assert.equal(peer.activity.length, 1)
  assert.equal(Object.hasOwn(peer, 'userId'), false)
  for (const viewer of [null, outsider]) {
    h.actor(viewer)
    const profile = (await (await h.call('user', 'GET', me)).json()).profile
    assert.equal(profile.profileNote, '<b>Plain text</b>')
    assert.equal(profile.notes.length, 0)
    assert.equal(profile.activity.length, 0)
    assert.equal(JSON.stringify(profile).includes('SECRET'), false)
  }
  h.members[1].status = 'banned'
  assert.equal((await h.services.getPublicProfile(me, other)).notes.length, 0)
  h.actor(me)
  await h.call('profileNote', 'PATCH', me, { profileNote: '' })
  assert.equal((await h.services.getPublicProfile(me, null)).profileNote, '')
  assert.equal((await h.call('user', 'GET', '00000000-0000-4000-8000-000000000099')).status, 404)
})

test('profile links expose real navigation, a focusable anchor and Space activation', () => {
  const { ProfileLink } = loadSource('src/components/profile/profile-link.tsx', { 'next/link': { default: 'a' } })
  const link = ProfileLink({ userId: me, username: 'Ada', avatar: true })
  assert.equal(link.props.href, `/profile/${me}`)
  let clicked = 0
  let prevented = false
  link.props.onKeyDown({ key: ' ', preventDefault: () => { prevented = true }, currentTarget: { click: () => clicked++ } })
  assert.equal(prevented, true)
  assert.equal(clicked, 1)
  link.props.onKeyDown({ key: 'Enter', currentTarget: { click: () => clicked++ } })
  assert.equal(clicked, 1, 'Enter retains native link activation')
  const html = renderToStaticMarkup(React.createElement(ProfileLink, { userId: me, username: 'Ada', avatar: true }))
  assert.match(html, /<a href="\/profile\//)
  assert.match(html, /aria-label="View Ada&#x27;s profile"/)
})

test('minimal toggle announces state and the provider persists through the existing storage hook', () => {
  let stored = null
  let key
  const root = { dataset: {} }
  const { MinimalModeProvider } = loadSource('src/components/providers/minimal-mode-provider.tsx', {
    react: { ...React, useEffect: fn => fn() },
    '@/hooks/use-stored-value': { useStoredValue: name => { key = name; return [stored, value => { stored = value }] } },
    globals: { document: { documentElement: root } },
  })
  let provider = MinimalModeProvider({ children: null })
  assert.equal(provider.props.value.minimal, false)
  provider.props.value.toggle()
  assert.equal(key, 'refocus-minimal-mode')
  assert.equal(stored, 'true')
  provider = MinimalModeProvider({ children: null })
  assert.equal(provider.props.value.minimal, true)
  assert.equal(root.dataset.minimal, 'true')
  const { MinimalModeToggle } = loadSource('src/components/layout/minimal-mode-toggle.tsx', {
    '@/components/providers/minimal-mode-provider': { useMinimalMode: () => provider.props.value },
  })
  const toggle = MinimalModeToggle()
  assert.equal(toggle.props['aria-pressed'], true)
  assert.equal(toggle.props.title, 'Minimal mode')
  toggle.props.onClick()
  assert.equal(stored, 'false')
})
