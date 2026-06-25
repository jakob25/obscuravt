'use client'

import { OnboardingGate } from '@/components/onboarding/onboarding-gate'
import { SignalShell } from '@/components/vault/signal-shell'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <SignalShell>{children}</SignalShell>
    </OnboardingGate>
  )
}