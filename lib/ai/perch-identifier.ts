import { MODEL } from './config'
import { installModel, isModelInstalled } from './model-store'
import type { AudioIdentifier, IdentificationResult, WorkerResponse } from './types'

/** Main-thread facade for identifier.worker.ts. One instance = one model session. */
export class PerchIdentifier implements AudioIdentifier {
  readonly modelId = MODEL.modelId
  private worker: Worker | null = null
  private loading: Promise<void> | null = null
  private nextId = 1
  private pending = new Map<
    number,
    { resolve: (r: IdentificationResult) => void; reject: (e: Error) => void }
  >()

  isInstalled() {
    return isModelInstalled()
  }

  install(onProgress: (fraction: number) => void) {
    return installModel((f) => onProgress(f))
  }

  load(): Promise<void> {
    if (this.loading) return this.loading
    const worker = new Worker(new URL('./identifier.worker.ts', import.meta.url), {
      type: 'module',
    })
    this.worker = worker
    this.loading = new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data
        if (msg.type === 'loaded') resolve()
        else if (msg.type === 'load-error') reject(new Error(msg.error))
        else if (msg.type === 'result' || msg.type === 'error') {
          const handlers = this.pending.get(msg.id)
          if (!handlers) return
          this.pending.delete(msg.id)
          if (msg.type === 'result') handlers.resolve(msg.result)
          else handlers.reject(new Error(msg.error))
        }
      }
      worker.onerror = (e) => {
        const error = new Error(e.message || 'Identifier worker crashed')
        reject(error)
        for (const h of this.pending.values()) h.reject(error)
        this.pending.clear()
      }
      worker.postMessage({ type: 'load' })
    })
    this.loading.catch(() => {
      this.loading = null
    })
    return this.loading
  }

  async identify(pcm32k: Float32Array): Promise<IdentificationResult> {
    await this.load()
    const worker = this.worker
    if (!worker) throw new Error('Identifier was released')
    const id = this.nextId++
    const copy = pcm32k.slice()
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      worker.postMessage({ type: 'identify', id, pcm: copy }, [copy.buffer])
    })
  }

  async release(): Promise<void> {
    const worker = this.worker
    this.worker = null
    this.loading = null
    for (const h of this.pending.values()) h.reject(new Error('Identifier was released'))
    this.pending.clear()
    if (worker) {
      worker.postMessage({ type: 'release' })
      setTimeout(() => worker.terminate(), 500)
    }
  }
}
