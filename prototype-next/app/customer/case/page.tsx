import { Suspense } from 'react'

import CustomerCasePage from '@/src/views/customer-case/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <CustomerCasePage />
    </Suspense>
  )
}
