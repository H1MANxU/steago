/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm'
import { MODEL, TOP_K } from './config'
import { loadLabels, type Label } from './labels'
import { readModelBytes } from './model-store'
import type { Candidate, WorkerRequest, WorkerResponse } from './types'

ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false

let session: ort.InferenceSession | null = null
let labels: Label[] = []

const post = (msg: WorkerResponse) => self.postMessage(msg)

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

/** Splits into 5 s windows with 50% overlap; short clips are zero-padded. */
function toWindows(pcm: Float32Array): Float32Array[] {
  const { windowSamples, hopSamples } = MODEL
  if (pcm.length <= windowSamples) {
    const w = new Float32Array(windowSamples)
    w.set(pcm)
    return [w]
  }
  const windows: Float32Array[] = []
  for (let start = 0; start < pcm.length; start += hopSamples) {
    const w = new Float32Array(windowSamples)
    w.set(pcm.subarray(start, Math.min(start + windowSamples, pcm.length)))
    windows.push(w)
    if (start + windowSamples >= pcm.length) break
  }
  return windows
}

async function identify(pcm: Float32Array) {
  if (!session) throw new Error('Model session is not loaded')
  const started = performance.now()
  const maxScores = new Float32Array(MODEL.numClasses).fill(-Infinity)

  for (const window of toWindows(pcm)) {
    const input = new ort.Tensor('float32', window, [1, MODEL.windowSamples])
    const outputs = await session.run({ [MODEL.inputName]: input }, [MODEL.labelOutput])
    const logits = outputs[MODEL.labelOutput].data as Float32Array
    for (let i = 0; i < maxScores.length; i++) {
      if (logits[i] > maxScores[i]) maxScores[i] = logits[i]
    }
    input.dispose()
    outputs[MODEL.labelOutput].dispose()
  }

  const top: number[] = []
  for (let i = 0; i < maxScores.length; i++) {
    if (top.length < TOP_K) {
      top.push(i)
      top.sort((a, b) => maxScores[b] - maxScores[a])
    } else if (maxScores[i] > maxScores[top[TOP_K - 1]]) {
      top[TOP_K - 1] = i
      top.sort((a, b) => maxScores[b] - maxScores[a])
    }
  }

  const candidates: Candidate[] = top.map((i) => {
    const label = labels[i]
    return {
      labelId: label.labelId,
      scientificName: label.scientificName,
      commonName: label.commonName,
      score: sigmoid(maxScores[i]),
    }
  })

  return { modelId: MODEL.modelId, candidates, durationMs: Math.round(performance.now() - started) }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data
  if (msg.type === 'load') {
    try {
      if (!session) {
        const [bytes, loaded] = await Promise.all([readModelBytes(), loadLabels()])
        labels = loaded
        session = await ort.InferenceSession.create(new Uint8Array(bytes), {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        })
      }
      post({ type: 'loaded' })
    } catch (err) {
      post({ type: 'load-error', error: err instanceof Error ? err.message : String(err) })
    }
  } else if (msg.type === 'identify') {
    try {
      post({ type: 'result', id: msg.id, result: await identify(msg.pcm) })
    } catch (err) {
      post({ type: 'error', id: msg.id, error: err instanceof Error ? err.message : String(err) })
    }
  } else if (msg.type === 'release') {
    await session?.release()
    session = null
    post({ type: 'released' })
  }
}
