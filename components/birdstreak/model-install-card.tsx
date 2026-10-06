'use client'

import { CheckCircle2, Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MODEL } from '@/lib/ai/config'
import { cancelInstall, resetInstall, startInstall, useInstallState } from '@/lib/ai/install-store'
import { useModelInstalled } from '@/lib/hooks'
import { formatBytes } from '@/lib/format'
import { ProgressBar } from './progress-bar'

export function ModelInstallCard() {
  const install = useInstallState()
  const installed = useModelInstalled()

  if (installed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="font-medium">Bird identifier ready</p>
          <p className="text-sm text-muted-foreground">It works offline from now on.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="font-medium">Download the bird identifier</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {`One-time download, ${formatBytes(MODEL.sizeBytes)}. Wi-Fi recommended. After that, identifying calls works without signal.`}
        </p>
      </div>

      {install.status === 'running' && (
        <div className="flex flex-col gap-2">
          <ProgressBar
            value={install.fraction}
            label={install.phase === 'downloading' ? 'Downloading' : install.phase === 'verifying' ? 'Checking the file' : 'Saving'}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {install.phase === 'downloading'
                ? `${formatBytes(install.fraction * MODEL.sizeBytes)} of ${formatBytes(MODEL.sizeBytes)}`
                : install.phase === 'verifying'
                  ? 'Checking the file…'
                  : 'Saving to this device…'}
            </span>
            {install.phase === 'downloading' && (
              <Button variant="ghost" size="sm" className="min-h-11" onClick={cancelInstall}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {install.status === 'failed' && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-sm text-destructive">
            {`The download didn't finish. ${install.error}`}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              resetInstall()
              startInstall()
            }}
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {install.status === 'idle' && (
        <Button className="min-h-11" onClick={startInstall}>
          <Download aria-hidden="true" />
          {`Download (${formatBytes(MODEL.sizeBytes)})`}
        </Button>
      )}
    </div>
  )
}
