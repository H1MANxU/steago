import { toLocalDay } from '@/lib/game/day'
import { questForDay, type QuestTemplate } from '@/lib/game/quests'
import { computeStreak } from '@/lib/game/streak'
import { computeXp, levelFor } from '@/lib/game/xp'
import type { Observation } from './db'

export interface SpeciesEntry {
  labelId: string
  firstSeen: number
  firstDay: string
  observationCount: number
}

export interface Derived {
  xp: number
  level: number
  levelProgress: number
  levelSpan: number
  streak: number
  todayDone: boolean
  quest: QuestTemplate
  questProgress: number
  questComplete: boolean
  species: SpeciesEntry[]
  pendingCount: number
  observationCount: number
}

type ObsLite = Pick<Observation, 'createdAt' | 'localDay' | 'status' | 'chosenLabelId'>

/** Species in order of first discovery (oldest first). */
export function deriveSpecies(observations: ObsLite[]): SpeciesEntry[] {
  const map = new Map<string, SpeciesEntry>()
  for (const o of observations) {
    if (o.status !== 'identified' || !o.chosenLabelId) continue
    const entry = map.get(o.chosenLabelId)
    if (!entry) {
      map.set(o.chosenLabelId, {
        labelId: o.chosenLabelId,
        firstSeen: o.createdAt,
        firstDay: o.localDay,
        observationCount: 1,
      })
    } else {
      entry.observationCount++
      if (o.createdAt < entry.firstSeen) {
        entry.firstSeen = o.createdAt
        entry.firstDay = o.localDay
      }
    }
  }
  return [...map.values()].sort((a, b) => a.firstSeen - b.firstSeen)
}

function questProgressFor(day: string, obsByDay: Map<string, number>, newSpeciesByDay: Map<string, number>) {
  const quest = questForDay(day)
  const progress = quest.metric === 'observations' ? obsByDay.get(day) ?? 0 : newSpeciesByDay.get(day) ?? 0
  return { quest, progress, complete: progress >= quest.target }
}

export function derive(observations: ObsLite[], now: Date = new Date()): Derived {
  const today = toLocalDay(now)
  const species = deriveSpecies(observations)

  const obsByDay = new Map<string, number>()
  for (const o of observations) obsByDay.set(o.localDay, (obsByDay.get(o.localDay) ?? 0) + 1)

  const newSpeciesByDay = new Map<string, number>()
  for (const s of species) newSpeciesByDay.set(s.firstDay, (newSpeciesByDay.get(s.firstDay) ?? 0) + 1)

  let completedQuestDays = 0
  for (const day of obsByDay.keys()) {
    if (questProgressFor(day, obsByDay, newSpeciesByDay).complete) completedQuestDays++
  }

  const xp = computeXp(observations.length, species.length, completedQuestDays)
  const { level, progress, span } = levelFor(xp)
  const streak = computeStreak(new Set(obsByDay.keys()), today)
  const todayQuest = questProgressFor(today, obsByDay, newSpeciesByDay)

  return {
    xp,
    level,
    levelProgress: progress,
    levelSpan: span,
    streak: streak.count,
    todayDone: streak.todayDone,
    quest: todayQuest.quest,
    questProgress: Math.min(todayQuest.progress, todayQuest.quest.target),
    questComplete: todayQuest.complete,
    species,
    pendingCount: observations.filter((o) => o.status === 'pending').length,
    observationCount: observations.length,
  }
}
