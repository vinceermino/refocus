import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './load-source.mjs'

const { calculateStreaks, utcDay, validGoal } = loadSource('src/lib/focus-goals.ts')
const now = new Date('2026-09-20T18:30:00Z')
const day = (date, seconds = 7200, goalMinutes = 120) => ({ day: new Date(`${date}T00:00:00Z`), focusSeconds: seconds, goalMinutes })

test('goals reject non-integers, coercible strings, zero, negatives, infinities and goals above the study quota', () => {
  for (const value of [0, -1, 1.1, '120', null, NaN, Infinity, 481]) assert.equal(validGoal(value), false)
  for (const value of [1, 120, 480]) assert.equal(validGoal(value), true)
})

test('day boundaries are UTC regardless of input offset', () => {
  assert.equal(utcDay(new Date('2026-09-21T01:00:00+08:00')).toISOString(), '2026-09-20T00:00:00.000Z')
})

test('no completed goals gives a zero streak even with study activity', () => {
  const result = calculateStreaks([day('2026-09-20', 7199)], now)
  assert.equal(result.currentStreak, 0)
  assert.equal(result.longestStreak, 0)
})

test('today counts immediately at threshold, and repeated computation cannot increment twice', () => {
  const days = [day('2026-09-18'), day('2026-09-19'), day('2026-09-20')]
  for (let i = 0; i < 2; i++) assert.equal(calculateStreaks(days, now).currentStreak, 3)
})

test('unfinished today retains yesterday’s streak, then strictly resets when the day passes', () => {
  const days = [day('2026-09-18'), day('2026-09-19'), day('2026-09-20', 100)]
  assert.equal(calculateStreaks(days, now).currentStreak, 2)
  assert.equal(calculateStreaks(days, new Date('2026-09-21T00:00:00Z')).currentStreak, 0)
})

test('missing days break a streak; meeting today starts a new streak', () => {
  const result = calculateStreaks([day('2026-09-16'), day('2026-09-17'), day('2026-09-20')], now)
  assert.equal(result.currentStreak, 1)
  assert.equal(result.longestStreak, 2)
})

test('each historical day retains its own goal; changing today recalculates achievement', () => {
  const days = [day('2026-09-19', 3600, 60), day('2026-09-20', 3600, 120)]
  assert.equal(calculateStreaks(days, now).currentStreak, 1)
  days[1].goalMinutes = 60
  assert.equal(calculateStreaks(days, now).currentStreak, 2)
  days[1].goalMinutes = 120
  assert.equal(calculateStreaks(days, now).currentStreak, 1)
})

test('consecutive goals span month, year and leap-day boundaries', () => {
  for (const [a, b] of [['2025-12-31', '2026-01-01'], ['2024-02-28', '2024-02-29'], ['2024-02-29', '2024-03-01']]) {
    assert.equal(calculateStreaks([day(a), day(b)], new Date(`${b}T12:00:00Z`)).currentStreak, 2)
  }
})

test('setDailyGoal authenticates and persists only today without overwriting focus time', async () => {
  let saved
  const actions = loadSource('src/actions/stats.ts', {
    '@/lib/auth-profile': { getAuthProfile: async () => ({ id: 'me' }) },
    '@/lib/prisma': { prisma: { dailyStat: { upsert: async args => { saved = args } } } },
    '@/lib/study-stats': { loadStudyStats: async () => ({ goalMinutes: 60 }) },
    'next/cache': { revalidatePath: () => {} },
  })
  assert.ok((await actions.setDailyGoal(-1)).error)
  assert.equal(saved, undefined)
  assert.equal((await actions.setDailyGoal(60)).stats.goalMinutes, 60)
  assert.equal(saved.where.profileId_day.profileId, 'me')
  assert.equal(saved.update.goalMinutes, 60)
  assert.equal(Object.hasOwn(saved.update, 'focusSeconds'), false)
  assert.equal(saved.create.day.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10))
})
