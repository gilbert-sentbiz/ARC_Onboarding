import { Suspense } from 'react'

import CustomerReviewFirstPage from '@/src/views/customer-review-first/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <CustomerReviewFirstPage />
    </Suspense>
  )
}
