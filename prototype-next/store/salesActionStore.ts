import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SalesAction } from '@/types'

type SalesActionState = {
  actions: Record<string, SalesAction[]>
  addAction: (caseId: string, author: { name: string; email: string }, text: string) => void
  getActions: (caseId: string) => SalesAction[]
}

export const useSalesActionStore = create<SalesActionState>()(
  persist(
    (set, get) => ({
      actions: {},
      addAction: (caseId, author, text) => {
        const action: SalesAction = {
          id: `sa_${Date.now()}`,
          caseId,
          author,
          text,
          createdAt: Date.now(),
        }
        set((s) => ({
          actions: {
            ...s.actions,
            [caseId]: [...(s.actions[caseId] ?? []), action],
          },
        }))
      },
      getActions: (caseId) => get().actions[caseId] ?? [],
    }),
    { name: 'sales_actions' }
  )
)
