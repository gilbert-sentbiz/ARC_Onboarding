'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { toast } from '@/src/shared/lib/toast'

import { GlobalLoadingBar } from './GlobalLoadingBar'
import { ToastContainer } from './ToastContainer'

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toast.negative(error instanceof Error ? error.message : String(error))
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.negative(error instanceof Error ? error.message : String(error))
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingBar />
      {children}
      <ToastContainer />
    </QueryClientProvider>
  )
}
