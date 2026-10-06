// Forwards mono microphone frames to the main thread in ~85 ms batches.
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Float32Array(4096)
    this.length = 0
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) {
      if (this.length + channel.length > this.buffer.length) this.flush()
      this.buffer.set(channel, this.length)
      this.length += channel.length
      if (this.length >= this.buffer.length - 128) this.flush()
    }
    return true
  }

  flush() {
    if (this.length === 0) return
    const chunk = this.buffer.slice(0, this.length)
    this.port.postMessage(chunk, [chunk.buffer])
    this.length = 0
  }
}

registerProcessor('capture-processor', CaptureProcessor)
