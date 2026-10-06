import type { IdentificationResult } from '@/lib/ai/types'
import { toLocalDay } from '@/lib/game/day'
import { db, type Observation } from './db'
import { derive } from './derive'

export async function saveObservation(input: {
  audio: Blob
  durationMs: number
  location?: Observation['location']
}): Promise<Observation> {
  const now = new Date()
  const obs: Observation = {
    id: crypto.randomUUID(),
    createdAt: now.getTime(),
    localDay: toLocalDay(now),
    audio: input.audio,
    durationMs: input.durationMs,
    status: 'pending',
    location: input.location,
  }
  await db.observations.add(obs)
  return obs
}

export function attachIdentification(id: string, result: IdentificationResult) {
  return db.observations.update(id, { candidates: result.candidates, modelId: result.modelId })
}

export interface ConfirmOutcome {
  isNewSpecies: boolean
  xpGained: number
}

async function xpNow() {
  return derive(await db.observations.toArray()).xp
}

export async function confirmSpecies(
  id: string,
  labelId: string,
  method: 'audio' | 'manual',
): Promise<ConfirmOutcome> {
  return db.transaction('rw', db.observations, async () => {
    const before = await xpNow()
    const alreadyKnown =
      (await db.observations
        .where('chosenLabelId')
        .equals(labelId)
        .filter((o) => o.status === 'identified' && o.id !== id)
        .count()) > 0
    await db.observations.update(id, {
      status: 'identified',
      chosenLabelId: labelId,
      identificationMethod: method,
    })
    const after = await xpNow()
    return { isNewSpecies: !alreadyKnown, xpGained: after - before }
  })
}

export function markNotSure(id: string) {
  return db.observations.update(id, {
    status: 'unidentified',
    chosenLabelId: undefined,
    identificationMethod: undefined,
  })
}
