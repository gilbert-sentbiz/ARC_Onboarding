import type { Metadata } from 'next'

import { GlobalStyles } from '@/src/shared/ui/GlobalStyles'
import { Providers } from '@/src/shared/ui/Providers'

export const metadata: Metadata = {
  title: 'ARK Onboarding',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <GlobalStyles />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
