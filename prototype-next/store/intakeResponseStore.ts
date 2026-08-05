import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IntakeResponse, IntakeStatus } from '@/types'

interface IntakeResponseState {
  responses: Record<string, IntakeResponse>
  upsert: (r: IntakeResponse) => void
  getByCase: (caseId: string, phase: 'first' | 'second') => IntakeResponse | null
}

export const useIntakeResponseStore = create<IntakeResponseState>()(
  persist(
    (set, get) => ({
      responses: {},
      upsert: (r) => set((s) => ({ responses: { ...s.responses, [r.id]: r } })),
      getByCase: (caseId, phase) =>
        Object.values(get().responses).find((r) => r.caseId === caseId && r.phase === phase) ?? null,
    }),
    { name: 'arc_intake_responses' }
  )
)

export function makeIntakeId(caseId: string, phase: 'first' | 'second') {
  return `${caseId}_${phase}`
}

export function getOrInitIntake(
  caseId: string,
  phase: 'first' | 'second',
  status: IntakeStatus = 'not_started'
): IntakeResponse {
  const store = useIntakeResponseStore.getState()
  const existing = store.getByCase(caseId, phase)
  if (existing) return existing
  const r: IntakeResponse = {
    id: makeIntakeId(caseId, phase),
    caseId,
    phase,
    status,
    answers: {},
    savedAt: Date.now(),
  }
  store.upsert(r)
  return r
}
