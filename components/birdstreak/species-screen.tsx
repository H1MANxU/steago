'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft } from 'lucide-react'
import { db, type Observation } from '@/lib/data/db'
import { formatDate, formatDateTime, formatDuration } from '@/lib/format'
import { useLabelMap, useObjectUrl } from '@/lib/hooks'
import { href } from '@/lib/router'

export function SpeciesScreen({ labelId }: { labelId: string }) {
  const labelMap = useLabelMap()
  const observations = useLiveQuery(
    () =>
      db.observations
        .where('chosenLabelId')
        .equals(labelId)
        .filter((o) => o.status === 'identified')
        .sortBy('createdAt'),
    [labelId],
  )
  const label = labelMap?.get(labelId)

  return (
    <div className="flex flex-col gap-6">
      <a
        href={href({ name: 'journal' })}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Journal
      </a>

      <header className="flex flex-col gap-1 border-b-2 border-foreground pb-4">
        <h1 className="font-serif text-4xl leading-tight text-balance">{label?.commonName ?? labelId}</h1>
        <p className="text-lg text-muted-foreground italic">{label?.scientificName ?? labelId}</p>
      </header>

      {observations === undefined ? (
        <div aria-busy="true" />
      ) : observations.length === 0 ? (
        <p className="text-muted-foreground">No confirmed recordings of this species yet.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-sm text-muted-foreground">First seen</dt>
              <dd className="font-serif text-xl">{formatDate(observations[0].createdAt)}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-sm text-muted-foreground">Observations</dt>
              <dd className="font-serif text-xl tabular-nums">{observations.length}</dd>
            </div>
          </dl>

          <section aria-labelledby="obs-heading" className="flex flex-col gap-3">
            <h2 id="obs-heading" className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Recordings
            </h2>
            <ul className="flex flex-col gap-3">
              {observations.map((o) => (
                <ObservationRow key={o.id} obs={o} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function ObservationRow({ obs }: { obs: Observation }) {
  const url = useObjectUrl(obs.audio)
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <a href={href({ name: 'results', id: obs.id })} className="font-medium underline-offset-4 hover:underline">
          {formatDateTime(obs.createdAt)}
        </a>
        <span className="text-sm text-muted-foreground tabular-nums">{formatDuration(obs.durationMs)}</span>
      </div>
      {obs.identificationMethod === 'manual' && <p className="text-sm text-muted-foreground">Chosen from the full list</p>}
      {url && (
        <audio controls src={url} className="w-full" aria-label={`Play recording from ${formatDateTime(obs.createdAt)}`}>
          <track kind="captions" />
        </audio>
      )}
    </li>
  )
}
