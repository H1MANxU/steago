'use client'

import { Download, FileText, MapPin, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MODEL } from '@/lib/ai/config'
import { deleteModel } from '@/lib/ai/model-store'
import { db, setSetting } from '@/lib/data/db'
import { exportJournal } from '@/lib/data/export'
import { getApproximateLocation } from '@/lib/data/location'
import { toLocalDay } from '@/lib/game/day'
import { formatBytes, formatDate } from '@/lib/format'
import { useModelInstalled, useSettings } from '@/lib/hooks'
import { navigate } from '@/lib/router'
import { ConfirmDialog } from './confirm-dialog'
import { LicensesDialog } from './licenses-dialog'
import { ModelInstallCard } from './model-install-card'

type Pending = 'delete-model' | 'delete-all' | null

export function SettingsScreen() {
  const settings = useSettings()
  const installed = useModelInstalled()
  const [confirm, setConfirm] = useState<Pending>(null)
  const [licensesOpen, setLicensesOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [locationNote, setLocationNote] = useState<string | null>(null)
  const record = settings?.modelRecord

  const doExport = async () => {
    setExporting(true)
    try {
      const blob = await exportJournal()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `birdstreak-journal-${toLocalDay()}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setExporting(false)
    }
  }

  const toggleLocation = async (next: boolean) => {
    setLocationNote(null)
    if (next) {
      const loc = await getApproximateLocation()
      if (!loc) {
        setLocationNote('Location is unavailable or was not allowed. Everything else works the same.')
        return
      }
    }
    await setSetting('attachLocation', next)
  }

  const deleteAll = async () => {
    await deleteModel()
    await db.delete()
    navigate({ name: 'home' }, { replace: true })
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="border-b-2 border-foreground pb-3 font-serif text-3xl">Settings</h1>

      <section aria-labelledby="model-heading" className="flex flex-col gap-3">
        <h2 id="model-heading" className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Bird identifier
        </h2>
        <ModelInstallCard />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-border bg-card p-4 text-sm">
          <dt className="text-muted-foreground">Status</dt>
          <dd>{installed ? 'Installed' : 'Not installed'}</dd>
          <dt className="text-muted-foreground">Model</dt>
          <dd>{`${MODEL.name}, ${MODEL.version}`}</dd>
          <dt className="text-muted-foreground">Model ID</dt>
          <dd className="font-mono break-all">{MODEL.modelId}</dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd>{formatBytes(record?.sizeBytes ?? MODEL.sizeBytes)}</dd>
          {installed && record && (
            <>
              <dt className="text-muted-foreground">Installed</dt>
              <dd>{formatDate(record.installedAt)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Runtime</dt>
          <dd>ONNX Runtime Web, WASM, single thread</dd>
          <dt className="text-muted-foreground">SHA-256</dt>
          <dd className="font-mono break-all">{MODEL.sha256}</dd>
        </dl>
        {installed && (
          <Button variant="destructive" className="min-h-11" onClick={() => setConfirm('delete-model')}>
            <Trash2 aria-hidden="true" />
            Delete model
          </Button>
        )}
      </section>

      <section aria-labelledby="privacy-heading" className="flex flex-col gap-3">
        <h2 id="privacy-heading" className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Privacy
        </h2>
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4">
          <MapPin className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="flex flex-1 flex-col">
            <span className="font-medium">Attach approximate location</span>
            <span className="text-sm text-muted-foreground">Rounded to about 1 km. Stays on this device.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="size-6 accent-[var(--primary)]"
            checked={settings?.attachLocation ?? false}
            onChange={(e) => void toggleLocation(e.target.checked)}
          />
        </label>
        {locationNote && (
          <p role="status" className="text-sm text-muted-foreground">
            {locationNote}
          </p>
        )}
      </section>

      <section aria-labelledby="data-heading" className="flex flex-col gap-3">
        <h2 id="data-heading" className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Your data
        </h2>
        <Button variant="outline" size="lg" className="min-h-12" disabled={exporting} onClick={() => void doExport()}>
          <Download aria-hidden="true" />
          {exporting ? 'Preparing…' : 'Export journal'}
        </Button>
        <Button variant="outline" size="lg" className="min-h-12" onClick={() => setLicensesOpen(true)}>
          <FileText aria-hidden="true" />
          Licenses
        </Button>
        <Button variant="destructive" size="lg" className="min-h-12" onClick={() => setConfirm('delete-all')}>
          <Trash2 aria-hidden="true" />
          Delete all data
        </Button>
      </section>

      <ConfirmDialog
        open={confirm === 'delete-model'}
        title="Delete the model?"
        description="This frees up space on your device. Your journal and recordings stay. New recordings will be saved for later until you download it again."
        confirmLabel="Delete model"
        onConfirm={() => void deleteModel()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete-all'}
        title="Delete everything?"
        description="This removes every recording, your journal, your streak, settings, and the model from this device. It can't be undone. Export first if you want a copy."
        confirmLabel="Delete all data"
        onConfirm={() => void deleteAll()}
        onClose={() => setConfirm(null)}
      />
      <LicensesDialog open={licensesOpen} onClose={() => setLicensesOpen(false)} />
    </div>
  )
}
