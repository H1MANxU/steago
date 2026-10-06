'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getLabelMap, type Label } from '@/lib/ai/labels'
import { isModelInstalled } from '@/lib/ai/model-store'
import { db, type ModelRecord } from '@/lib/data/db'
import { derive } from '@/lib/data/derive'
import { useInstallState } from '@/lib/ai/install-store'

export function useObservations() {
  return useLiveQuery(() => db.observations.orderBy('createdAt').toArray(), [])
}

export function useDerived() {
  const observations = useObservations()
  return useMemo(() => (observations ? derive(observations) : undefined), [observations])
}

export function useSettings() {
  return useLiveQuery(async () => {
    const rows = await db.settings.toArray()
    const map = new Map(rows.map((r) => [r.key, r.value]))
    return {
      onboardingDone: map.get('onboardingDone') === true,
      attachLocation: map.get('attachLocation') === true,
      modelRecord: map.get('modelRecord') as ModelRecord | undefined,
    }
  }, [])
}

/** Re-checks the cache whenever the model record changes or an install finishes. */
export function useModelInstalled(): boolean | undefined {
  const settings = useSettings()
  const install = useInstallState()
  return useLiveQuery(
    () => isModelInstalled(),
    [settings?.modelRecord?.installedAt, install.status],
  )
}

let labelMapCache: Map<string, Label> | null = null
const labelListeners = new Set<() => void>()
let labelLoadStarted = false

function ensureLabels() {
  if (labelLoadStarted) return
  labelLoadStarted = true
  getLabelMap()
    .then((m) => {
      labelMapCache = m
      for (const l of labelListeners) l()
    })
    .catch(() => {
      labelLoadStarted = false
    })
}

export function useLabelMap(): Map<string, Label> | null {
  return useSyncExternalStore(
    (cb) => {
      labelListeners.add(cb)
      ensureLabels()
      return () => labelListeners.delete(cb)
    },
    () => labelMapCache,
    () => null,
  )
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}

export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
      setUrl(undefined)
    }
  }, [blob])
  return url
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}
