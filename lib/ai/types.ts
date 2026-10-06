export interface Candidate {
  labelId: string
  scientificName: string
  commonName: string
  score: number
}

export interface IdentificationResult {
  modelId: string
  candidates: Candidate[]
  durationMs: number
}

export interface AudioIdentifier {
  readonly modelId: string
  isInstalled(): Promise<boolean>
  install(onProgress: (fraction: number) => void): Promise<void>
  identify(pcm32k: Float32Array): Promise<IdentificationResult>
  release(): Promise<void>
}

export type WorkerRequest =
  | { type: 'load' }
  | { type: 'identify'; id: number; pcm: Float32Array }
  | { type: 'release' }

export type WorkerResponse =
  | { type: 'loaded' }
  | { type: 'load-error'; error: string }
  | { type: 'result'; id: number; result: IdentificationResult }
  | { type: 'error'; id: number; error: string }
  | { type: 'released' }
