import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/layout/navbar'
import { AddButton } from '@/components/common/add-button'
import { AuthProvider } from '@/lib/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { SiteBackdrop } from '@/components/layout/site-backdrop'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site-copy'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${SITE_NAME} — Discover VTubers by Vibe`,
  description: SITE_DESCRIPTION,
  keywords: ['VTuber', 'discovery', 'clips', 'streaming', 'community', 'oshi', 'bets'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0d14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased min-h-screen bg-vault-deep text-foreground">
        <SiteBackdrop />
        <div className="relative z-10 flex min-h-screen flex-col">
          <AuthProvider>
            <AppShell>
              <Navbar />
              <main className="min-h-[calc(100vh-4rem)] flex-1">
                {children}
              </main>
              <AddButton />
            </AppShell>
          </AuthProvider>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
