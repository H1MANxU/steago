'use client'

import { BookOpen, CheckCircle2, Circle, Flame, Hourglass, Mic } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useDerived, useModelInstalled, useObservations } from '@/lib/hooks'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'
import { ProgressBar } from './progress-bar'

export function HomeScreen() {
  const derived = useDerived()
  const observations = useObservations()
  const modelInstalled = useModelInstalled()

  if (!derived) return <div aria-busy="true" />

  const firstPending = observations?.find((o) => o.status === 'pending')
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="font-serif text-3xl">BirdStreak</h1>
      </header>

      <section aria-label="Streak and level" className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Flame className="size-4 text-accent" aria-hidden="true" />
            Streak
          </div>
          <p className="font-serif text-4xl tabular-nums">
            {derived.streak}
            <span className="ml-1 font-sans text-base text-muted-foreground">{derived.streak === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {derived.todayDone ? 'Done for today' : derived.streak > 0 ? 'Keep it going today' : 'Start one today'}
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="font-serif text-4xl tabular-nums">{derived.level}</p>
          <ProgressBar value={derived.levelProgress / derived.levelSpan} label={`Progress to level ${derived.level + 1}`} />
          <p className="text-sm text-muted-foreground tabular-nums">
            {`${derived.levelProgress} / ${derived.levelSpan} XP`}
          </p>
        </div>
      </section>

      <section aria-labelledby="quest-heading" className="ruled rounded-lg border border-border bg-card p-4">
        <h2 id="quest-heading" className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {"Today's quest"}
        </h2>
        <div className="mt-2 flex items-start gap-3">
          {derived.questComplete ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div className="flex-1">
            <p className="font-serif text-xl leading-snug">{derived.quest.title}</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {derived.questComplete
                ? 'Complete. +100 XP'
                : `${derived.questProgress} of ${derived.quest.target} · +100 XP`}
            </p>
          </div>
        </div>
        {!modelInstalled && derived.quest.metric === 'newSpecies' && (
          <p className="mt-3 text-sm text-muted-foreground">
            Recordings will be saved until the bird identifier is downloaded in Settings.
          </p>
        )}
      </section>

      {derived.pendingCount > 0 && firstPending && (
        <a
          href={href({ name: 'results', id: firstPending.id })}
          className="flex min-h-11 items-center gap-3 rounded-lg border border-dashed border-input bg-secondary/60 p-4 hover:bg-secondary"
        >
          <Hourglass className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span className="flex-1">
            <span className="font-medium">{`${derived.pendingCount} to identify`}</span>
            <span className="block text-sm text-muted-foreground">
              {modelInstalled ? 'Tap to review the next one.' : 'Download the bird identifier in Settings.'}
            </span>
          </span>
        </a>
      )}

      {derived.observationCount === 0 && (
        <p className="font-serif text-lg leading-relaxed text-muted-foreground italic">
          Your journal is empty. Go outside and record your first call.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <a href={href({ name: 'listen' })} className={cn(buttonVariants({ size: 'lg' }), 'min-h-14 text-base')}>
          <Mic aria-hidden="true" className="size-5" />
          Listen
        </a>
        <a
          href={href({ name: 'journal' })}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-12 text-base')}
        >
          <BookOpen aria-hidden="true" className="size-5" />
          {`Journal · ${derived.species.length} ${derived.species.length === 1 ? 'species' : 'species'}`}
        </a>
      </div>
    </div>
  )
}
