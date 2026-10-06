'use client'

import { CloudOff } from 'lucide-react'
import { useOnline } from '@/lib/hooks'

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      <CloudOff className="size-4" aria-hidden="true" />
      <span>Offline. Your discoveries are saved on this device.</span>
    </div>
  )
}
