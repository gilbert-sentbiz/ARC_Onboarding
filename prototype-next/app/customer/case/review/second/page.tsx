import { Suspense } from 'react'

import CustomerReviewSecondPage from '@/src/views/customer-review-second/ui/Page'
export default function Page() {
  return (
    <Suspense>
      <CustomerReviewSecondPage />
    </Suspense>
  )
}
