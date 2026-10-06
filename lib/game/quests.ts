export type QuestMetric = 'observations' | 'newSpecies'

export interface QuestTemplate {
  id: string
  title: string
  target: number
  metric: QuestMetric
}

export const QUEST_TEMPLATES: readonly QuestTemplate[] = [
  { id: 'record-1', title: 'Record 1 bird call', target: 1, metric: 'observations' },
  { id: 'new-species', title: "Confirm a species you haven't recorded before", target: 1, metric: 'newSpecies' },
  { id: 'record-2', title: 'Record 2 bird calls', target: 2, metric: 'observations' },
]

/** djb2: stable across devices and runtimes. */
export function stableHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

export function questForDay(localDay: string): QuestTemplate {
  return QUEST_TEMPLATES[stableHash(localDay) % QUEST_TEMPLATES.length]
}
