export const XP_PER_OBSERVATION = 50
export const XP_PER_SPECIES = 100
export const XP_PER_QUEST = 100
export const XP_PER_LEVEL = 500

export function computeXp(observations: number, distinctSpecies: number, completedQuestDays: number) {
  return XP_PER_OBSERVATION * observations + XP_PER_SPECIES * distinctSpecies + XP_PER_QUEST * completedQuestDays
}

export function levelFor(xp: number) {
  return { level: 1 + Math.floor(xp / XP_PER_LEVEL), progress: xp % XP_PER_LEVEL, span: XP_PER_LEVEL }
}
