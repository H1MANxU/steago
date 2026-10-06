'use client'

import { ChevronRight, Mic } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { useDerived, useLabelMap } from '@/lib/hooks'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'

export function JournalScreen() {
  const derived = useDerived()
  const labelMap = useLabelMap()

  if (!derived) return <div aria-busy="true" />
  const { species } = derived

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
        <h1 className="font-serif text-3xl">Journal</h1>
        <p className="text-muted-foreground tabular-nums">
          <span className="font-serif text-2xl text-foreground">{species.length}</span>
          {species.length === 1 ? ' species' : ' species'}
        </p>
      </header>

      {species.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="font-serif text-xl leading-relaxed text-muted-foreground italic">
            No species yet. The first one is out there somewhere.
          </p>
          <a href={href({ name: 'listen' })} className={cn(buttonVariants({ size: 'lg' }), 'min-h-12 text-base')}>
            <Mic aria-hidden="true" />
            Go explore
          </a>
        </div>
      ) : (
        <ol className="flex flex-col">
          {species.map((s, i) => {
            const label = labelMap?.get(s.labelId)
            return (
              <li key={s.labelId} className="border-b border-border">
                <a
                  href={href({ name: 'species', labelId: s.labelId })}
                  className="flex min-h-16 items-center gap-3 py-3 hover:bg-card"
                >
                  <span className="w-8 font-serif text-lg text-muted-foreground tabular-nums" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-serif text-lg">{label?.commonName ?? s.labelId}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      <span className="italic">{label?.scientificName ?? s.labelId}</span>
                      {` · first ${formatDate(s.firstSeen)}`}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {`${s.observationCount}×`}
                    <span className="sr-only">{s.observationCount === 1 ? ' observation' : ' observations'}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
