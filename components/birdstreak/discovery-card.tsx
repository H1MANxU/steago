import { BookOpen, Mic } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'

export function DiscoveryCard({
  isNewSpecies,
  xpGained,
  commonName,
  scientificName,
  labelId,
}: {
  isNewSpecies: boolean
  xpGained: number
  commonName: string
  scientificName: string
  labelId: string
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div
        role="status"
        className="animate-discovery ruled flex flex-col items-center gap-3 rounded-xl border-2 border-primary bg-card px-6 py-10 text-center shadow-sm"
      >
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
          {isNewSpecies ? 'New species' : 'Added to your journal'}
        </p>
        <h1 className="font-serif text-4xl leading-tight text-balance">{commonName}</h1>
        <p className="text-muted-foreground italic">{scientificName}</p>
        <p className="mt-2 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground tabular-nums">
          {xpGained > 0 ? `+${xpGained} XP` : 'Already counted'}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <a
          href={href({ name: 'species', labelId })}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-12 text-base')}
        >
          <BookOpen aria-hidden="true" />
          See in journal
        </a>
        <a href={href({ name: 'listen' })} className={cn(buttonVariants({ size: 'lg' }), 'min-h-12 text-base')}>
          <Mic aria-hidden="true" />
          Listen again
        </a>
        <a href={href({ name: 'home' })} className="min-h-11 content-center text-center text-muted-foreground underline underline-offset-4">
          Done for now
        </a>
      </div>
    </div>
  )
}
