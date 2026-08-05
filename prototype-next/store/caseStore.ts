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

  // Migrate old role-based status codes → new action-based codes (PI-124)
  const STATUS_REMAP: Record<string, string> = {
    SALES_REVIEW_REQUIRED: 'INITIAL_SCREENING',
    COMPLIANCE_REVIEW_REQUIRED: 'APPROVAL_REVIEW_REQUIRED',
    OPS_REVIEW_REQUIRED: 'ACCOUNT_SETUP_REQUIRED',
  }
  const arcCasesRaw = localStorage.getItem('arc_cases')
  if (arcCasesRaw) {
    try {
      const parsed = JSON.parse(arcCasesRaw)
      const cases = parsed?.state?.cases as Record<string, { status: string; revisionRequestedFrom?: string }> | undefined
      if (cases) {
        let changed = false
        for (const c of Object.values(cases)) {
          if (STATUS_REMAP[c.status]) { c.status = STATUS_REMAP[c.status]; changed = true }
          if (c.revisionRequestedFrom && STATUS_REMAP[c.revisionRequestedFrom]) {
            c.revisionRequestedFrom = STATUS_REMAP[c.revisionRequestedFrom]; changed = true
          }
        }
        if (changed) localStorage.setItem('arc_cases', JSON.stringify(parsed))
      }
    } catch { /* ignore parse errors */ }
  }
  const arcEventsRaw = localStorage.getItem('arc_case_events')
  if (arcEventsRaw) {
    try {
      const parsed = JSON.parse(arcEventsRaw)
      const events = parsed?.state?.events as Array<{ payload?: { previousStatus?: string; newStatus?: string } }> | undefined
      if (events) {
        let changed = false
        for (const e of events) {
          if (e.payload?.previousStatus && STATUS_REMAP[e.payload.previousStatus]) {
            e.payload.previousStatus = STATUS_REMAP[e.payload.previousStatus]; changed = true
          }
          if (e.payload?.newStatus && STATUS_REMAP[e.payload.newStatus]) {
            e.payload.newStatus = STATUS_REMAP[e.payload.newStatus]; changed = true
          }
        }
        if (changed) localStorage.setItem('arc_case_events', JSON.stringify(parsed))
      }
    } catch { /* ignore parse errors */ }
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
