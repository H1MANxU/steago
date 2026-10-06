'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function LicensesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      if (text === null) {
        fetch('/ATTRIBUTION.md')
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
          .then(setText)
          .catch(() => setText('Could not load ATTRIBUTION.md.'))
      }
    }
    if (!open && dialog.open) dialog.close()
  }, [open, text])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="licenses-title"
      className="m-auto flex max-h-[85dvh] w-[min(40rem,calc(100%-2rem))] flex-col rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-foreground/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <h2 id="licenses-title" className="font-serif text-2xl">
          Licenses
        </h2>
        <Button variant="outline" className="min-h-11 px-4" onClick={onClose}>
          Close
        </Button>
      </div>
      <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {text ?? 'Loading…'}
      </pre>
    </dialog>
  )
}
