import type { Metadata } from 'next'

import { GlobalStyles } from '@/src/shared/ui/GlobalStyles'

export const metadata: Metadata = {
  title: 'ARK Onboarding',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <GlobalStyles />
        {children}
      </body>
    </html>
  )
}
