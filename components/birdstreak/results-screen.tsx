'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, HelpCircle, Hourglass, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { LOW_CONFIDENCE } from '@/lib/ai/config'
import { identifyObservation } from '@/lib/ai/identifier-instance'
import { db } from '@/lib/data/db'
import { confirmSpecies, markNotSure, type ConfirmOutcome } from '@/lib/data/observations'
import { formatDateTime, formatDuration, formatPercent } from '@/lib/format'
import { useLabelMap, useModelInstalled, useObjectUrl } from '@/lib/hooks'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'
import { DiscoveryCard } from './discovery-card'
import { SpeciesSearch } from './species-search'

export function ResultsScreen({ id }: { id: string }) {
  const obs = useLiveQuery(() => db.observations.get(id), [id])
  const labelMap = useLabelMap()
  const modelInstalled = useModelInstalled()
  const audioUrl = useObjectUrl(obs?.audio)
  const [selected, setSelected] = useState(0)
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<(ConfirmOutcome & { labelId: string }) | null>(null)
  const [retryState, setRetryState] = useState<'idle' | 'running' | 'failed'>('idle')

  // Pending recordings with no candidates yet: try once when the model is available.
  const needsIdentify = obs?.status === 'pending' && !obs.candidates
  useEffect(() => {
    if (!needsIdentify || !modelInstalled || retryState !== 'idle') return
    setRetryState('running')
    identifyObservation(id)
      .then(() => setRetryState('idle'))
      .catch(() => setRetryState('failed'))
  }, [needsIdentify, modelInstalled, id, retryState])

  if (obs === undefined) return <div aria-busy="true" />
  if (obs === null) {
    return (
      <div className="flex flex-col gap-4">
        <p>That recording is no longer in your journal.</p>
        <a href={href({ name: 'home' })} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>
          Back to Home
        </a>
      </div>
    )
  }

  const confirm = async (labelId: string, method: 'audio' | 'manual') => {
    setBusy(true)
    try {
      const result = await confirmSpecies(id, labelId, method)
      setOutcome({ ...result, labelId })
      setSearching(false)
    } finally {
      setBusy(false)
    }
  }

  if (outcome) {
    const label = labelMap?.get(outcome.labelId)
    return (
      <DiscoveryCard
        isNewSpecies={outcome.isNewSpecies}
        xpGained={outcome.xpGained}
        commonName={label?.commonName ?? outcome.labelId}
        scientificName={label?.scientificName ?? outcome.labelId}
        labelId={outcome.labelId}
      />
    )
  }

  if (searching) {
    return (
      <SpeciesSearch
        onCancel={() => setSearching(false)}
        onChoose={(labelId) => void confirm(labelId, 'manual')}
        disabled={busy}
      />
    )
  }

  const candidates = obs.candidates ?? []
  const chosenLabel = obs.chosenLabelId ? labelMap?.get(obs.chosenLabelId) : undefined
  const lowConfidence = candidates.length > 0 && candidates[0].score < LOW_CONFIDENCE

  return (
    <div className="flex flex-col gap-5">
      <a
        href={href({ name: 'home' })}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Home
      </a>

      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {`${formatDateTime(obs.createdAt)} · ${formatDuration(obs.durationMs)}`}
        </p>
        <h1 className="font-serif text-3xl">Possible match</h1>
      </header>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" aria-label="Play this recording">
          <track kind="captions" />
        </audio>
      )}

      {obs.status === 'identified' && chosenLabel && (
        <p className="rounded-lg border border-border bg-card p-4">
          {'You confirmed '}
          <a className="font-medium text-primary underline underline-offset-4" href={href({ name: 'species', labelId: chosenLabel.labelId })}>
            {chosenLabel.commonName}
          </a>
          {' for this recording. You can change it below.'}
        </p>
      )}
      {obs.status === 'unidentified' && (
        <p className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
          {'Marked as not sure. It still counts toward your streak.'}
        </p>
      )}

      {candidates.length === 0 ? (
        <PendingNotice
          modelInstalled={modelInstalled}
          state={retryState}
          onRetry={() => setRetryState('idle')}
        />
      ) : (
        <>
          {lowConfidence && (
            <p className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              {"We're not very sure. Try moving closer or recording longer."}
            </p>
          )}
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Possible matches, top 5</legend>
            {candidates.map((c, i) => {
              const isSelected = selected === i
              return (
                <label
                  key={c.labelId}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors',
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-input',
                  )}
                >
                  <input
                    type="radio"
                    name="candidate"
                    className="size-5 accent-[var(--primary)]"
                    checked={isSelected}
                    onChange={() => setSelected(i)}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{c.commonName}</span>
                    <span className="truncate text-sm text-muted-foreground italic">{c.scientificName}</span>
                  </span>
                  <span className="flex flex-col items-end text-right">
                    <span className="font-serif text-lg tabular-nums">{formatPercent(c.score)}</span>
                    <span className="text-xs text-muted-foreground">match</span>
                  </span>
                </label>
              )
            })}
          </fieldset>
          <Button
            size="lg"
            className="min-h-12 text-base"
            disabled={busy}
            onClick={() => void confirm(candidates[selected].labelId, 'audio')}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
            {selected === 0 ? "That's the bird" : `That's the bird: ${candidates[selected].commonName}`}
          </Button>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" className="min-h-12" disabled={busy} onClick={() => setSearching(true)}>
          <Search aria-hidden="true" />
          Choose another
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="min-h-12"
          disabled={busy || obs.status === 'unidentified'}
          onClick={() => void markNotSure(id)}
        >
          <HelpCircle aria-hidden="true" />
          Not sure
        </Button>
      </div>
    </div>
  )
}

function PendingNotice({
  modelInstalled,
  state,
  onRetry,
}: {
  modelInstalled: boolean | undefined
  state: 'idle' | 'running' | 'failed'
  onRetry: () => void
}) {
  if (modelInstalled && state === 'running') {
    return (
      <p role="status" className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Analyzing on your device
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-input bg-card p-4">
      <p className="flex items-start gap-2">
        <Hourglass className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        {modelInstalled
          ? "We couldn't identify that. It's saved and we'll try again later."
          : 'Saved for later. Download the bird identifier in Settings to see possible matches.'}
      </p>
      {modelInstalled ? (
        <Button variant="outline" className="min-h-11" onClick={onRetry}>
          Try again now
        </Button>
      ) : (
        <a href={href({ name: 'settings' })} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>
          Open Settings
        </a>
      )}
    </div>
  )
}
