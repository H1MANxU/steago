'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-foreground/40"
    >
      <h2 id="confirm-title" className="font-serif text-2xl">
        {title}
      </h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" className="min-h-11 px-4" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="min-h-11 px-4"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
