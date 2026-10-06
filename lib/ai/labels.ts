import { COMMON_NAMES_URL, LABELS_URL } from './config'

export interface Label {
  index: number
  labelId: string
  scientificName: string
  commonName: string
}

let labelsPromise: Promise<Label[]> | null = null

/** Rows of the unmodified Perch labels.csv. labelId is the exact row text. */
export function loadLabels(): Promise<Label[]> {
  labelsPromise ??= (async () => {
    const [csv, names] = await Promise.all([
      fetch(LABELS_URL).then((r) => {
        if (!r.ok) throw new Error(`labels.csv: HTTP ${r.status}`)
        return r.text()
      }),
      fetch(COMMON_NAMES_URL)
        .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
        .catch(() => [] as string[]),
    ])
    const rows = csv.replace(/\r/g, '').split('\n').slice(1).filter(Boolean)
    return rows.map((row, index) => {
      const scientificName = row.trim()
      return {
        index,
        labelId: scientificName,
        scientificName,
        commonName: names[index] || scientificName,
      }
    })
  })().catch((err) => {
    labelsPromise = null
    throw err
  })
  return labelsPromise
}

export async function getLabelMap(): Promise<Map<string, Label>> {
  const labels = await loadLabels()
  return new Map(labels.map((l) => [l.labelId, l]))
}
