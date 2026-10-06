import { previousDay } from './day'

/**
 * Consecutive local days with at least one observation, counting back from today.
 * If today has none yet, counting starts from yesterday (the streak is not broken
 * until the day ends).
 */
export function computeStreak(days: Set<string>, today: string) {
  const todayDone = days.has(today)
  let cursor = todayDone ? today : previousDay(today)
  let count = 0
  while (days.has(cursor)) {
    count++
    cursor = previousDay(cursor)
  }
  return { count, todayDone }
}
