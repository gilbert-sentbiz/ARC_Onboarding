import { api } from '@/services/apiClient'
import type { CaseResponse, CaseSummaryResponse, InternalCaseResponse, IntakeAnswersRequest, CloseRequest, IntakeResponse } from '@/types/api'

// C1: POST /cases
export function createCase(token: string) {
  return api.post<CaseResponse>('/cases', undefined, { token })
}

// C2: GET /cases/{id}
export function getCase(caseId: string, token: string) {
  return api.get<CaseResponse>(`/cases/${caseId}`, { token })
}

// C4: POST /cases/{id}/intake/first/submit
export function submitFirstIntake(caseId: string, body: IntakeAnswersRequest, token: string) {
  return api.post<CaseResponse>(`/cases/${caseId}/intake/first/submit`, body, { token })
}

// C6: POST /cases/{id}/intake/second/submit
export function submitSecondIntake(caseId: string, body: IntakeAnswersRequest, token: string) {
  return api.post<CaseResponse>(`/cases/${caseId}/intake/second/submit`, body, { token })
}

// C7: GET /cases/{id}/intake/{phase}
export function getIntake(caseId: string, phase: string, token: string) {
  return api.get<IntakeResponse>(`/cases/${caseId}/intake/${phase}`, { token })
}

// C8: POST /cases/{id}/resubmit
export function resubmitRevision(caseId: string, token: string) {
  return api.post<CaseResponse>(`/cases/${caseId}/resubmit`, undefined, { token })
}

// I1: GET /internal/cases
export function listCases(params: { status?: string; assignee?: string } = {}, token: string) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()
  return api.get<CaseSummaryResponse[]>(`/internal/cases${qs ? `?${qs}` : ''}`, { token })
}

// I2: GET /internal/cases/{id}
export function getInternalCase(caseId: string, token: string) {
  return api.get<InternalCaseResponse>(`/internal/cases/${caseId}`, { token })
}

// I3: POST /internal/cases/{id}/advance
export function advanceCase(caseId: string, token: string) {
  return api.post<CaseResponse>(`/internal/cases/${caseId}/advance`, undefined, { token })
}

// I4: POST /internal/cases/{id}/close
export function closeCase(caseId: string, body: CloseRequest, token: string) {
  return api.post<CaseResponse>(`/internal/cases/${caseId}/close`, body, { token })
}
