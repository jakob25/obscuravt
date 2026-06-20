import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Navbar } from '@/components/common/Navbar'
import { AddButton } from '@/components/common/add-button'
import { TestingBanner } from '@/components/common/testing-banner'

export const metadata: Metadata = {
  title: 'ObscuraVT',
  description: 'Discover VTubers through vibe, clips, and community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a14] text-white antialiased">
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
