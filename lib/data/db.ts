import Dexie, { type EntityTable } from 'dexie'
import type { Candidate } from '@/lib/ai/types'

export type ObservationStatus = 'pending' | 'identified' | 'unidentified'

export interface Observation {
  id: string
  createdAt: number
  localDay: string
  audio: Blob
  durationMs: number
  status: ObservationStatus
  candidates?: Candidate[]
  chosenLabelId?: string
  identificationMethod?: 'audio' | 'manual'
  modelId?: string
  location?: { lat: number; lng: number; accuracyM: number }
}

export interface ModelRecord {
  modelId: string
  version: string
  sha256: string
  installedAt: number
  sizeBytes: number
}

export type SettingRow =
  | { key: 'onboardingDone'; value: boolean }
  | { key: 'modelRecord'; value: ModelRecord }
  | { key: 'attachLocation'; value: boolean }

export interface ModelFile {
  name: string
  data: Blob
}

export const db = new Dexie('birdstreak') as Dexie & {
  observations: EntityTable<Observation, 'id'>
  settings: EntityTable<SettingRow, 'key'>
  modelFiles: EntityTable<ModelFile, 'name'>
}

db.version(1).stores({
  observations: 'id, createdAt, localDay, status, chosenLabelId',
  settings: 'key',
  modelFiles: 'name',
})

export interface SettingValues {
  onboardingDone: boolean
  modelRecord: ModelRecord
  attachLocation: boolean
}

export async function getSetting<K extends keyof SettingValues>(key: K): Promise<SettingValues[K] | undefined> {
  const row = (await db.settings.get(key)) as { value: SettingValues[K] } | undefined
  return row?.value
}

export function setSetting<K extends keyof SettingValues>(key: K, value: SettingValues[K]) {
  return db.settings.put({ key, value } as SettingRow)
}
