'use client'

import { OnboardingGate } from '@/components/onboarding/onboarding-gate'

export function AppShell({ children }: { children: React.ReactNode }) {
  return <OnboardingGate>{children}</OnboardingGate>
}