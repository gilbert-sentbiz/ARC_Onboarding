import { Suspense } from 'react'

import CustomerCaseInformationPage from '@/src/views/customer-case-information/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <CustomerCaseInformationPage />
    </Suspense>
  )
}
