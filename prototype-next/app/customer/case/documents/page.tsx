import { Suspense } from 'react'

import CustomerCaseDocumentsPage from '@/src/views/customer-case-documents/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <CustomerCaseDocumentsPage />
    </Suspense>
  )
}
