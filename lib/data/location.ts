import type { Observation } from './db'

/** Coordinates rounded to 2 decimals (~1 km). Resolves undefined on denial or timeout. */
export function getApproximateLocation(timeoutMs = 8000): Promise<Observation['location']> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined)
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lng: Math.round(pos.coords.longitude * 100) / 100,
          accuracyM: Math.max(1000, Math.round(pos.coords.accuracy)),
        }),
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60_000 },
    )
  })
}
