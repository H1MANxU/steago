'use client'

import { ArrowLeft, Loader2, Mic, MicOff, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { acquireIdentifier, releaseIdentifier } from '@/lib/ai/identifier-instance'
import type { PerchIdentifier } from '@/lib/ai/perch-identifier'
import { MicDeniedError, startCapture, type CaptureSession } from '@/lib/audio/capture'
import { resampleTo32k, TARGET_RATE } from '@/lib/audio/resample'
import { encodeWav } from '@/lib/audio/wav'
import { getSetting } from '@/lib/data/db'
import { getApproximateLocation } from '@/lib/data/location'
import { attachIdentification, saveObservation } from '@/lib/data/observations'
import { useModelInstalled } from '@/lib/hooks'
import { href, navigate } from '@/lib/router'
import { cn } from '@/lib/utils'

const MAX_MS = 10_000
const MIN_MS = 3_000

type State =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'too-short' }
  | { kind: 'analyzing'; id: string }
  | { kind: 'mic-denied' }
  | { kind: 'error'; message: string }

export function ListenScreen() {
  const modelInstalled = useModelInstalled()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [modelState, setModelState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  const sessionRef = useRef<CaptureSession | null>(null)
  const identifierRef = useRef<PerchIdentifier | null>(null)
  const stoppingRef = useRef(false)

  // NFR-04: the model session lives only while this screen is open.
  useEffect(() => {
    if (!modelInstalled) return
    const ident = acquireIdentifier()
    identifierRef.current = ident
    setModelState('loading')
    ident
      .load()
      .then(() => setModelState('ready'))
      .catch(() => setModelState('failed'))
    return () => {
      identifierRef.current = null
      releaseIdentifier()
    }
  }, [modelInstalled])

  // AC-16: never leave the mic on after leaving this screen.
  useEffect(() => () => sessionRef.current?.cancel(), [])

  const stop = useCallback(async () => {
    const session = sessionRef.current
    if (!session || stoppingRef.current) return
    stoppingRef.current = true
    sessionRef.current = null
    const { samples, sampleRate } = await session.stop()
    setLevel(0)
    const durationMs = Math.round((samples.length / sampleRate) * 1000)
    stoppingRef.current = false

    if (durationMs < MIN_MS) {
      setState({ kind: 'too-short' })
      return
    }

    try {
      const pcm = await resampleTo32k(samples, sampleRate)
      const attachLocation = await getSetting('attachLocation')
      const location = attachLocation ? await getApproximateLocation() : undefined
      const obs = await saveObservation({ audio: encodeWav(pcm, TARGET_RATE), durationMs, location })

      const ident = identifierRef.current
      if (!ident) {
        navigate({ name: 'results', id: obs.id }, { replace: true })
        return
      }
      setState({ kind: 'analyzing', id: obs.id })
      try {
        const result = await ident.identify(pcm)
        await attachIdentification(obs.id, result)
      } catch {
        // FR-04: the observation is already saved as pending; Results shows the message.
      }
      navigate({ name: 'results', id: obs.id }, { replace: true })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' })
    }
  }, [])

  const start = useCallback(async () => {
    setState({ kind: 'starting' })
    setElapsed(0)
    try {
      sessionRef.current = await startCapture((rms) => setLevel(Math.min(1, rms * 6)))
      setState({ kind: 'recording', startedAt: performance.now() })
    } catch (err) {
      if (err instanceof MicDeniedError) setState({ kind: 'mic-denied' })
      else setState({ kind: 'error', message: "We couldn't open the microphone on this device." })
    }
  }, [])

  useEffect(() => {
    if (state.kind !== 'recording') return
    let raf = 0
    const tick = () => {
      const ms = performance.now() - state.startedAt
      setElapsed(ms)
      if (ms >= MAX_MS) void stop()
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, stop])

  const recording = state.kind === 'recording'
  const seconds = Math.min(elapsed, MAX_MS) / 1000

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center">
        <a
          href={href({ name: 'home' })}
          className="-ml-2 flex min-h-11 min-w-11 items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground"
          onClick={() => sessionRef.current?.cancel()}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          <span>Back</span>
        </a>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {state.kind === 'mic-denied' ? (
          <MicDenied onRetry={start} />
        ) : state.kind === 'analyzing' ? (
          <div className="flex flex-col items-center gap-4" role="status">
            <Loader2 className="size-12 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <p className="font-serif text-2xl">Analyzing on your device</p>
            <p className="text-muted-foreground">Your recording is already saved.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl">{recording ? 'Listening…' : 'Ready to listen'}</h1>
              <p className="text-muted-foreground" aria-live="polite">
                {state.kind === 'too-short'
                  ? 'Too short. Try recording a little longer.'
                  : state.kind === 'error'
                    ? state.message
                    : recording
                      ? 'Hold still and point toward the sound.'
                      : 'Record 3 to 10 seconds of a bird call.'}
              </p>
            </div>

            <div className="relative flex size-56 items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary/15 transition-transform duration-75 motion-reduce:transition-none"
                style={{ transform: `scale(${0.7 + level * 0.3})` }}
              />
              <button
                type="button"
                onClick={recording ? () => void stop() : start}
                disabled={state.kind === 'starting'}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
                className={cn(
                  'relative flex size-36 items-center justify-center rounded-full shadow-lg transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-60',
                  recording ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground',
                )}
              >
                {recording ? <Square className="size-12 fill-current" aria-hidden="true" /> : <Mic className="size-14" aria-hidden="true" />}
              </button>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-2">
              <p className="font-serif text-4xl tabular-nums" aria-label={`${seconds.toFixed(1)} of 10 seconds`}>
                {`${seconds.toFixed(1)}`}
                <span className="font-sans text-lg text-muted-foreground"> / 10 s</span>
              </p>
              <LevelMeter level={recording ? level : 0} />
              {recording && (
                <Button variant="outline" size="lg" className="mt-2 min-h-12 text-base" onClick={() => void stop()}>
                  <Square className="fill-current" aria-hidden="true" />
                  Stop
                </Button>
              )}
            </div>

            <ModelNote installed={modelInstalled} modelState={modelState} />
          </>
        )}
      </div>
    </div>
  )
}

function LevelMeter({ level }: { level: number }) {
  const bars = 16
  const lit = Math.round(level * bars)
  return (
    <div className="flex h-6 items-end justify-center gap-1" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn('w-2 rounded-sm', i < lit ? 'bg-primary' : 'bg-muted')}
          style={{ height: `${30 + (i / bars) * 70}%` }}
        />
      ))}
    </div>
  )
}

function ModelNote({ installed, modelState }: { installed: boolean | undefined; modelState: string }) {
  if (installed === false) {
    return (
      <p className="max-w-xs text-sm text-muted-foreground">
        {"The bird identifier isn't downloaded yet. Recordings are saved and identified later."}
      </p>
    )
  }
  if (modelState === 'loading') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Getting the identifier ready…
      </p>
    )
  }
  if (modelState === 'failed') {
    return <p className="max-w-xs text-sm text-muted-foreground">The identifier couldn&apos;t start. Recordings are still saved.</p>
  }
  return null
}

function MicDenied({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4" role="alert">
      <MicOff className="size-12 text-accent" aria-hidden="true" />
      <h1 className="font-serif text-2xl">Microphone is off</h1>
      <p className="leading-relaxed text-muted-foreground">
        BirdStreak needs the microphone to record bird calls. The recording stays on your device.
      </p>
      <Button size="lg" className="min-h-12 text-base" onClick={onRetry}>
        Try again
      </Button>
      <details className="w-full rounded-lg border border-border bg-card p-4 text-left text-sm">
        <summary className="min-h-11 cursor-pointer content-center font-medium">How to allow the microphone</summary>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
          <li>Android Chrome: tap the icon left of the address bar, then Permissions, then Microphone.</li>
          <li>iPhone Safari: Settings, then Safari, then Microphone, then Allow. For the installed app, check Settings for BirdStreak.</li>
          <li>Desktop Chrome: click the icon left of the address bar and allow Microphone.</li>
        </ul>
      </details>
    </div>
  )
}
