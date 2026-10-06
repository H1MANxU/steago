'use client'

import { ArrowLeft, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useLabelMap } from '@/lib/hooks'

const MAX_RESULTS = 40

export function SpeciesSearch({
  onChoose,
  onCancel,
  disabled,
}: {
  onChoose: (labelId: string) => void
  onCancel: () => void
  disabled?: boolean
}) {
  const labelMap = useLabelMap()
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    if (!labelMap || q.length < 2) return []
    const out = []
    for (const label of labelMap.values()) {
      if (label.commonName.toLowerCase().includes(q) || label.scientificName.toLowerCase().includes(q)) {
        out.push(label)
        if (out.length >= MAX_RESULTS) break
      }
    }
    return out
  }, [labelMap, deferred])

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Back to matches
      </button>
      <h1 className="font-serif text-3xl">Choose another</h1>
      <label className="flex min-h-12 items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-3 focus-within:ring-ring/40">
        <Search className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Search species by name</span>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Common or scientific name"
          className="h-12 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </label>
      {!labelMap ? (
        <p className="text-muted-foreground" role="status">
          Loading species list…
        </p>
      ) : query.trim().length < 2 ? (
        <p className="text-muted-foreground">{`Type at least 2 letters to search ${labelMap.size.toLocaleString()} names.`}</p>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground">No names match that search.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card" aria-label="Search results">
          {results.map((label) => (
            <li key={label.labelId}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChoose(label.labelId)}
                className="flex min-h-14 w-full flex-col items-start justify-center px-4 py-2 text-left hover:bg-muted disabled:opacity-50"
              >
                <span className="font-medium">{label.commonName}</span>
                {label.commonName !== label.scientificName && (
                  <span className="text-sm text-muted-foreground italic">{label.scientificName}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
