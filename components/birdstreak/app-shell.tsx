'use client'

import { useEffect } from 'react'
import { processPendingQueue } from '@/lib/ai/identifier-instance'
import { useModelInstalled, useSettings } from '@/lib/hooks'
import { registerServiceWorker } from '@/lib/pwa/register'
import { useRoute } from '@/lib/router'
import { BottomNav } from './bottom-nav'
import { HomeScreen } from './home-screen'
import { JournalScreen } from './journal-screen'
import { ListenScreen } from './listen-screen'
import { OfflineBanner } from './offline-banner'
import { Onboarding } from './onboarding'
import { ResultsScreen } from './results-screen'
import { SettingsScreen } from './settings-screen'
import { SpeciesScreen } from './species-screen'

export function AppShell() {
  const settings = useSettings()
  const route = useRoute()
  const modelInstalled = useModelInstalled()

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (modelInstalled && route.name !== 'listen') void processPendingQueue()
  }, [modelInstalled, route.name])

  if (!settings) {
    return <div className="min-h-dvh" aria-busy="true" />
  }

  if (!settings.onboardingDone) {
    return <Onboarding />
  }

  const showNav = route.name !== 'listen'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <OfflineBanner />
      <main className="flex flex-1 flex-col px-5 pt-6 pb-32">
        {route.name === 'home' && <HomeScreen />}
        {route.name === 'listen' && <ListenScreen />}
        {route.name === 'results' && <ResultsScreen id={route.id} />}
        {route.name === 'journal' && <JournalScreen />}
        {route.name === 'species' && <SpeciesScreen labelId={route.labelId} />}
        {route.name === 'settings' && <SettingsScreen />}
      </main>
      {showNav && <BottomNav active={route.name} />}
    </div>
  )
}
