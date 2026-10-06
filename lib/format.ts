export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`
  return `${Math.round(bytes)} B`
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

export function formatDate(ms: number): string {
  return dateFmt.format(ms)
}

export function formatDateTime(ms: number): string {
  return `${dateFmt.format(ms)}, ${timeFmt.format(ms)}`
}

export function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`
}
