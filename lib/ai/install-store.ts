'use client'

import { useSyncExternalStore } from 'react'
import { installModel, type InstallPhase } from './model-store'

export type InstallState =
  | { status: 'idle' }
  | { status: 'running'; phase: InstallPhase; fraction: number }
  | { status: 'done' }
  | { status: 'failed'; error: string }

let state: InstallState = { status: 'idle' }
let controller: AbortController | null = null
const listeners = new Set<() => void>()

function set(next: InstallState) {
  state = next
  for (const l of listeners) l()
}

/** Module-level so a download survives navigating between screens. */
export function startInstall() {
  if (state.status === 'running') return
  controller = new AbortController()
  set({ status: 'running', phase: 'downloading', fraction: 0 })
  let last = 0
  installModel((fraction, phase) => {
    if (phase !== 'downloading' || fraction - last > 0.005 || fraction === 1) {
      last = fraction
      set({ status: 'running', phase, fraction })
    }
  }, controller.signal)
    .then(() => set({ status: 'done' }))
    .catch((err: unknown) => {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      set(aborted ? { status: 'idle' } : { status: 'failed', error: err instanceof Error ? err.message : String(err) })
    })
}

export function cancelInstall() {
  controller?.abort()
}

export function resetInstall() {
  if (state.status !== 'running') set({ status: 'idle' })
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}
