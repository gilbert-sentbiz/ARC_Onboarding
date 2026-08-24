import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Case } from '@/types'

// Migration: old 'cases' key had embedded documents/statusHistory/firstIntake/secondIntake.
// New 'arc_cases' key stores slim Case.
// PI-222: 레거시 'cases'(구 fat 스키마)만 제거하고 arc_*(현행 슬림 스토어)는 보존한다.
// 이전엔 old 'cases' 감지 시 arc_* 전부 삭제해 기존 케이스가 통째로 사라졌음.
// arc_cases의 구 상태코드는 아래 STATUS_REMAP로 in-place 마이그레이션.
if (typeof window !== 'undefined') {
  if (localStorage.getItem('cases')) {
    localStorage.removeItem('cases')
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
