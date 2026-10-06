export const TARGET_RATE = 32_000

/** Resamples mono PCM to 32 kHz using the browser's band-limited resampler. */
export async function resampleTo32k(samples: Float32Array, sampleRate: number): Promise<Float32Array> {
  if (sampleRate === TARGET_RATE) return samples
  const length = Math.max(1, Math.ceil((samples.length * TARGET_RATE) / sampleRate))
  const offline = new OfflineAudioContext(1, length, TARGET_RATE)
  const buffer = offline.createBuffer(1, samples.length, sampleRate)
  buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0)
  const src = offline.createBufferSource()
  src.buffer = buffer
  src.connect(offline.destination)
  src.start()
  const rendered = await offline.startRendering()
  return rendered.getChannelData(0).slice()
}
