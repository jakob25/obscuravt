import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { Navbar } from '@/components/common/navbar'
import { AddButton } from '@/components/common/add-button'
import { TestingBanner } from '@/components/common/testing-banner'

export const metadata: Metadata = {
  title: 'ObscuraVT - Discover Your Next Oshi',
  description: 'ObscuraVT is the ultimate discovery hub for VTubers and fans. Find your perfect match through vibe-based search, raw clips, community bets, and more.',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a14] text-white">
        <AuthProvider>
          <TestingBanner />
          <Navbar />
          <main>{children}</main>
          <AddButton />
        </AuthProvider>
      </body>
    </html>
  )
}
