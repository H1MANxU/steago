import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { db, getSetting, setSetting } from '@/lib/data/db'
import { MODEL, MODEL_CACHE, MODEL_CACHE_KEY } from './config'

export class HashMismatchError extends Error {
  constructor(actual: string) {
    super(`Model file failed verification (sha256 ${actual.slice(0, 12)}…)`)
  }
}

async function hasCachedFile(): Promise<boolean> {
  if ('caches' in globalThis) {
    const cache = await caches.open(MODEL_CACHE)
    if (await cache.match(MODEL_CACHE_KEY)) return true
  }
  return (await db.modelFiles.get(MODEL.modelId)) !== undefined
}

export async function isModelInstalled(): Promise<boolean> {
  const record = await getSetting('modelRecord')
  if (!record || record.modelId !== MODEL.modelId) return false
  return hasCachedFile()
}

export type InstallPhase = 'downloading' | 'verifying' | 'saving'

/** Streams the model, hashing as it arrives, then stores it in Cache Storage. */
export async function installModel(
  onProgress: (fraction: number, phase: InstallPhase) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(MODEL.url, { signal, mode: 'cors', credentials: 'omit' })
  if (!res.ok || !res.body) throw new Error(`Download failed (HTTP ${res.status})`)

  const total = Number(res.headers.get('content-length')) || MODEL.sizeBytes
  const hasher = sha256.create()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  const reader = res.body.getReader()
  let received = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    hasher.update(value)
    chunks.push(value as Uint8Array<ArrayBuffer>)
    received += value.byteLength
    onProgress(Math.min(received / total, 1), 'downloading')
  }

  onProgress(1, 'verifying')
  const actual = bytesToHex(hasher.digest())
  if (actual !== MODEL.sha256) throw new HashMismatchError(actual)

  onProgress(1, 'saving')
  const blob = new Blob(chunks, { type: 'application/octet-stream' })
  chunks.length = 0

  let stored = false
  if ('caches' in globalThis) {
    try {
      const cache = await caches.open(MODEL_CACHE)
      await cache.put(
        MODEL_CACHE_KEY,
        new Response(blob, {
          headers: { 'content-type': 'application/octet-stream', 'content-length': String(blob.size) },
        }),
      )
      stored = true
    } catch {
      stored = false
    }
  }
  if (!stored) await db.modelFiles.put({ name: MODEL.modelId, data: blob })

  await setSetting('modelRecord', {
    modelId: MODEL.modelId,
    version: MODEL.version,
    sha256: MODEL.sha256,
    installedAt: Date.now(),
    sizeBytes: blob.size,
  })
}

/** Used by the worker. Prefers Cache Storage, falls back to the IndexedDB copy. */
export async function readModelBytes(): Promise<ArrayBuffer> {
  if ('caches' in globalThis) {
    const cache = await caches.open(MODEL_CACHE)
    const hit = await cache.match(MODEL_CACHE_KEY)
    if (hit) return hit.arrayBuffer()
  }
  const file = await db.modelFiles.get(MODEL.modelId)
  if (file) return file.data.arrayBuffer()
  throw new Error('Model is not installed')
}

export async function deleteModel(): Promise<void> {
  if ('caches' in globalThis) await caches.delete(MODEL_CACHE)
  await db.modelFiles.clear()
  await db.settings.delete('modelRecord')
}
