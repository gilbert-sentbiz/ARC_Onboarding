import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CaseEvent } from '../types'

interface CaseEventState {
  events: Record<string, CaseEvent>
  append: (e: CaseEvent) => void
  getByCase: (caseId: string) => CaseEvent[]
}

export const useCaseEventStore = create<CaseEventState>()(
  persist(
    (set, get) => ({
      events: {},
      append: (e) => set((s) => ({ events: { ...s.events, [e.id]: e } })),
      getByCase: (caseId) =>
        Object.values(get().events)
          .filter((e) => e.caseId === caseId)
          .sort((a, b) => a.createdAt - b.createdAt),
    }),
    { name: 'arc_case_events' }
  )
)
