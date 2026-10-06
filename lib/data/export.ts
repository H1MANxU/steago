import { strToU8, zipSync, type Zippable } from 'fflate'
import { db } from './db'

export async function exportJournal(): Promise<Blob> {
  const observations = await db.observations.orderBy('createdAt').toArray()
  const files: Zippable = {}
  const records = []

  for (const o of observations) {
    const audioFile = `audio/${o.localDay}_${o.id}.wav`
    files[audioFile] = [new Uint8Array(await o.audio.arrayBuffer()), { level: 0 }]
    records.push({
      id: o.id,
      createdAt: new Date(o.createdAt).toISOString(),
      localDay: o.localDay,
      durationMs: o.durationMs,
      status: o.status,
      chosenLabelId: o.chosenLabelId ?? null,
      identificationMethod: o.identificationMethod ?? null,
      modelId: o.modelId ?? null,
      candidates: o.candidates ?? [],
      location: o.location ?? null,
      audioFile,
    })
  }

  const journal = {
    app: 'BirdStreak',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    observations: records,
  }
  files['journal.json'] = strToU8(JSON.stringify(journal, null, 2))
  return new Blob([zipSync(files)], { type: 'application/zip' })
}
