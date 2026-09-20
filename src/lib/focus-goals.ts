export const DEFAULT_GOAL_MINUTES = 120
export const MAX_DAILY_SECONDS = 8 * 60 * 60

export function utcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function validGoal(minutes: unknown): minutes is number {
  return typeof minutes === 'number' && Number.isInteger(minutes) && minutes > 0 && minutes <= 480
}

export function calculateStreaks(days: { day: Date; focusSeconds: number; goalMinutes: number }[], now = new Date()) {
  const today = utcDay(now).getTime()
  const dayMs = 86_400_000
  const achieved = [...new Set(days.filter(d => d.focusSeconds >= d.goalMinutes * 60 && d.day.getTime() <= today)
    .map(d => d.day.getTime()))].sort((a, b) => a - b)
  let longestStreak = 0
  let run = 0
  achieved.forEach((day, i) => {
    run = i > 0 && day - achieved[i - 1] === dayMs ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  })
  const completed = new Set(achieved)
  // Today is still in progress; yesterday's streak remains until midnight.
  let cursor = completed.has(today) ? today : today - dayMs
  let currentStreak = 0
  while (completed.has(cursor)) {
    currentStreak++
    cursor -= dayMs
  }
  return { currentStreak, longestStreak }
}
