import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RevisionRequest } from '@/types'

interface RevisionRequestState {
  requests: Record<string, RevisionRequest>
  add: (r: RevisionRequest) => void
  resolve: (id: string, resolvedAt: number) => void
  getByDocument: (documentId: string) => RevisionRequest[]
  getActiveByDocument: (documentId: string) => RevisionRequest[]
}

export const useRevisionRequestStore = create<RevisionRequestState>()(
  persist(
    (set, get) => ({
      requests: {},
      add: (r) => set((s) => ({ requests: { ...s.requests, [r.id]: r } })),
      resolve: (id, resolvedAt) =>
        set((s) => ({
          requests: { ...s.requests, [id]: { ...s.requests[id], resolvedAt } },
        })),
      getByDocument: (documentId) =>
        Object.values(get().requests).filter((r) => r.documentId === documentId),
      getActiveByDocument: (documentId) =>
        Object.values(get().requests).filter((r) => r.documentId === documentId && !r.resolvedAt),
    }),
    { name: 'arc_revision_requests' }
  )
)
