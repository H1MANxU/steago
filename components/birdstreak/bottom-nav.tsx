import { BookOpen, Home, Mic, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { href, type Route } from '@/lib/router'

const items = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'journal', label: 'Journal', icon: BookOpen },
  { name: 'settings', label: 'Settings', icon: Settings },
] as const

export function BottomNav({ active }: { active: Route['name'] }) {
  const showListen = active === 'home' || active === 'journal' || active === 'species'
  const current = active === 'species' ? 'journal' : active

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="relative mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ name, label, icon: Icon }) => {
          const isActive = current === name
          return (
            <a
              key={name}
              href={href({ name })}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-14 min-w-20 flex-col items-center justify-center gap-0.5 text-xs font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={cn(isActive && 'underline decoration-2 underline-offset-4')}>{label}</span>
            </a>
          )
        })}
        {showListen && (
          <a
            href={href({ name: 'listen' })}
            className="absolute -top-8 right-5 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Mic className="size-7" aria-hidden="true" />
            <span className="sr-only">Listen</span>
          </a>
        )}
      </div>
    </nav>
  )
}
