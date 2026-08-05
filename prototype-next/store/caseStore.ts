import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Case } from '@/types'

// Migration: old 'cases' key had embedded documents/statusHistory/firstIntake/secondIntake.
// New 'arc_cases' key stores slim Case. On old data detection, clear all arc_* stores.
if (typeof window !== 'undefined') {
  const oldData = localStorage.getItem('cases')
  if (oldData) {
    for (const key of [
      'cases', 'arc_cases', 'arc_documents', 'arc_document_files',
      'arc_revision_requests', 'arc_intake_responses', 'arc_case_events',
    ]) {
      localStorage.removeItem(key)
    }
  }
}

type CaseState = {
  cases: Record<string, Case>
  addCase: (c: Case) => void
  updateCase: (id: string, patch: Partial<Case>) => void
  findByEmail: (email: string) => Case | null
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      cases: {},
      addCase: (c) => set((s) => ({ cases: { ...s.cases, [c.id]: c } })),
      updateCase: (id, patch) =>
        set((s) => ({
          cases: { ...s.cases, [id]: { ...s.cases[id], ...patch, updatedAt: Date.now() } },
        })),
      findByEmail: (email) => {
        const all = Object.values(get().cases)
        return all.find((c) => c.customerEmail === email && c.status !== 'CLOSED') ?? null
      },
    }),
    { name: 'arc_cases' }
  )
)
