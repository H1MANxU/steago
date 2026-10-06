export class MicDeniedError extends Error {
  constructor() {
    super('Microphone permission denied')
  }
}

export interface CaptureResult {
  samples: Float32Array
  sampleRate: number
}

export interface CaptureSession {
  stop(): Promise<CaptureResult>
  cancel(): void
}

/**
 * Opens the microphone and streams mono frames through an AudioWorklet.
 * The mic track is stopped as soon as stop() or cancel() is called.
 */
export async function startCapture(onLevel: (rms: number) => void): Promise<CaptureSession> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
      throw new MicDeniedError()
    }
    throw err
  }

  const ctx = new AudioContext()
  const chunks: Float32Array[] = []
  let closed = false

  const shutdown = () => {
    if (closed) return
    closed = true
    for (const track of stream.getTracks()) track.stop()
    void ctx.close()
  }

  try {
    await ctx.audioWorklet.addModule('/worklets/capture-processor.js')
    if (ctx.state === 'suspended') await ctx.resume()
    const source = ctx.createMediaStreamSource(stream)
    const node = new AudioWorkletNode(ctx, 'capture-processor')
    const mute = ctx.createGain()
    mute.gain.value = 0
    node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      const chunk = e.data
      chunks.push(chunk)
      let sum = 0
      for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i]
      onLevel(Math.sqrt(sum / chunk.length))
    }
    source.connect(node).connect(mute).connect(ctx.destination)
  } catch (err) {
    shutdown()
    throw err
  }

  return {
    async stop() {
      const sampleRate = ctx.sampleRate
      await new Promise((r) => setTimeout(r, 100))
      shutdown()
      const length = chunks.reduce((n, c) => n + c.length, 0)
      const samples = new Float32Array(length)
      let offset = 0
      for (const c of chunks) {
        samples.set(c, offset)
        offset += c.length
      }
      return { samples, sampleRate }
    },
    cancel: shutdown,
  }
}
