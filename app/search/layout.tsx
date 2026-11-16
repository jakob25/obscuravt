import { WhatsHere } from '@/components/common/whats-here'

export const revalidate = 300

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <noscript>
        <WhatsHere />
      </noscript>
    </>
  )
}
