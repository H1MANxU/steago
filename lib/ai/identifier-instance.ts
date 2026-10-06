import { decodeWav } from '@/lib/audio/wav'
import { resampleTo32k } from '@/lib/audio/resample'
import { db } from '@/lib/data/db'
import { attachIdentification } from '@/lib/data/observations'
import { isModelInstalled } from './model-store'
import { PerchIdentifier } from './perch-identifier'

/**
 * One shared session (NFR-04). Screens acquire it while they need it; the
 * session is released as soon as nobody holds it.
 */
let identifier: PerchIdentifier | null = null
let holders = 0

export function acquireIdentifier(): PerchIdentifier {
  holders++
  identifier ??= new PerchIdentifier()
  return identifier
}

export function releaseIdentifier() {
  holders = Math.max(0, holders - 1)
  if (holders === 0 && identifier) {
    const current = identifier
    identifier = null
    void current.release()
  }
}

export async function identifyObservation(id: string): Promise<void> {
  const obs = await db.observations.get(id)
  if (!obs) throw new Error('Observation not found')
  const { samples, sampleRate } = await decodeWav(obs.audio)
  const pcm = await resampleTo32k(samples, sampleRate)
  const ident = acquireIdentifier()
  try {
    const result = await ident.identify(pcm)
    await attachIdentification(id, result)
  } finally {
    releaseIdentifier()
  }
}

let queueRunning = false

/** FR-05: identify pending recordings that have no candidates yet. */
export async function processPendingQueue(): Promise<void> {
  if (queueRunning) return
  if (!(await isModelInstalled())) return
  queueRunning = true
  try {
    const pending = await db.observations
      .where('status')
      .equals('pending')
      .filter((o) => !o.candidates)
      .primaryKeys()
    for (const id of pending) {
      try {
        await identifyObservation(id)
      } catch {
        // Stays pending; retried on the next pass.
      }
    }
  } finally {
    queueRunning = false
  }
}
