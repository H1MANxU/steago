/**
 * Pinned model. Source: https://huggingface.co/justinchuby/Perch-onnx (Apache-2.0),
 * an ONNX export of Google's Perch v2. The SHA-256 is the Git LFS object id of
 * perch_v2.onnx at the pinned revision.
 */
export const MODEL = {
  modelId: 'perch_v2@onnx-da88bf8',
  name: 'Perch v2',
  version: '2.0 (ONNX, float32)',
  revision: 'da88bf8c37c0b3068fc706fe509f633b9fbd28c1',
  url: 'https://huggingface.co/justinchuby/Perch-onnx/resolve/da88bf8c37c0b3068fc706fe509f633b9fbd28c1/perch_v2.onnx',
  sha256: 'bf0c8467a924cb074663970ca4a0ab1e143602121930209657d0dff5d5cefa1f',
  sizeBytes: 409_148_616,
  sampleRate: 32_000,
  windowSamples: 160_000,
  hopSamples: 80_000,
  inputName: 'inputs',
  labelOutput: 'label',
  numClasses: 14_795,
} as const

export const MODEL_CACHE = 'birdstreak-model-v1'
export const MODEL_CACHE_KEY = '/__model__/perch_v2.onnx'
export const LABELS_URL = '/models/labels.csv'
export const COMMON_NAMES_URL = '/models/common_names.json'
export const TOP_K = 5
export const LOW_CONFIDENCE = 0.5
