'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setSetting } from '@/lib/data/db'
import { navigate } from '@/lib/router'
import { ModelInstallCard } from './model-install-card'

export function Onboarding() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-6 pt-14 pb-10">
      <div className="flex flex-col gap-4">
        <img src="/icons/icon-192.png" alt="" width={72} height={72} className="size-18 rounded-2xl" />
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Field journal</p>
        <h1 className="font-serif text-4xl leading-tight text-balance">Go outside. Listen for a bird.</h1>
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          Record a call, see a possible match on your phone, and keep a journal of what you&apos;ve heard. A little each day keeps your streak going.
        </p>
      </div>

      <div className="flex items-start gap-3 border-l-2 border-primary pl-4">
        <Lock className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="leading-relaxed">Your recordings stay on your device. No account required.</p>
      </div>

      <ModelInstallCard />

      <div className="mt-auto flex flex-col gap-2">
        <Button
          size="lg"
          className="min-h-12 text-base"
          onClick={async () => {
            await setSetting('onboardingDone', true)
            navigate({ name: 'home' }, { replace: true })
          }}
        >
          Start exploring
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          You can skip the download. Recordings will wait until it&apos;s installed.
        </p>
      </div>
    </main>
  )
}
