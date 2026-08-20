import { Suspense } from 'react'

import InternalCasePage from '@/src/views/internal-case/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <InternalCasePage />
    </Suspense>
  )
}
