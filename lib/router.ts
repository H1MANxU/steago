'use client'

import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'listen' }
  | { name: 'results'; id: string }
  | { name: 'journal' }
  | { name: 'species'; labelId: string }
  | { name: 'settings' }

function parse(hash: string): Route {
  const [, name, param] = hash.replace(/^#/, '').split('/')
  const value = param ? decodeURIComponent(param) : ''
  switch (name) {
    case 'listen':
      return { name: 'listen' }
    case 'results':
      return value ? { name: 'results', id: value } : { name: 'home' }
    case 'journal':
      return { name: 'journal' }
    case 'species':
      return value ? { name: 'species', labelId: value } : { name: 'journal' }
    case 'settings':
      return { name: 'settings' }
    default:
      return { name: 'home' }
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'results':
      return `#/results/${encodeURIComponent(route.id)}`
    case 'species':
      return `#/species/${encodeURIComponent(route.labelId)}`
    default:
      return `#/${route.name}`
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const target = href(route)
  if (replace) {
    history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = target
  }
}

let cachedHash = ''
let cachedRoute: Route = { name: 'home' }

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    () => {
      if (window.location.hash !== cachedHash) {
        cachedHash = window.location.hash
        cachedRoute = parse(cachedHash)
      }
      return cachedRoute
    },
    () => cachedRoute,
  )
}
