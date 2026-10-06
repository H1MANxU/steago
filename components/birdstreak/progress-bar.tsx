import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  label,
  className,
  tone = 'primary',
}: {
  value: number
  label: string
  className?: string
  tone?: 'primary' | 'accent'
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none', tone === 'primary' ? 'bg-primary' : 'bg-accent')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
