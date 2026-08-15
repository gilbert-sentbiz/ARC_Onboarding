// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE: string = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8080'

function getCustomerToken(): string | null {
  return localStorage.getItem('arc_customer_token')
}
function getStaffToken(): string | null {
  return localStorage.getItem('arc_staff_token')
}
export function setCustomerToken(token: string) {
  localStorage.setItem('arc_customer_token', token)
}
export function setStaffToken(token: string) {
  localStorage.setItem('arc_staff_token', token)
}
export function clearTokens() {
  localStorage.removeItem('arc_customer_token')
  localStorage.removeItem('arc_staff_token')
}

async function req<T>(
  path: string,
  options: RequestInit = {},
  auth?: 'customer' | 'staff',
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (auth === 'customer') {
    const t = getCustomerToken()
    if (t) headers['Authorization'] = `Bearer ${t}`
  } else if (auth === 'staff') {
    const t = getStaffToken()
    if (t) headers['Authorization'] = `Bearer ${t}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function requestOtp(email: string): Promise<{ sent: boolean }> {
  return req('/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) })
}

export function verifyOtp(email: string, code: string): Promise<{ token: string }> {
  return req('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code }) })
}

export function mockLogin(email: string): Promise<{ token: string }> {
  return req('/internal/auth/mock-login', { method: 'POST', body: JSON.stringify({ email }) })
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export interface ActiveRulesResponse {
  segments: Array<{ id: string; axis: string; code: string; label: string }>
  questions: Array<{
    id: string; code: string; phase: string; classification: string
    ownerSegmentId?: string; label: string; inputType: string
    options?: unknown[]; isRequired: boolean; showWhen?: unknown
    repeat: boolean; parentQuestionId?: string; displayOrder: number
  }>
  docTemplates: Array<{
    id: string; type: string; displayName: string; classification: string
    ownerSegmentId?: string; isRequired: boolean; isConditional: boolean
    condition?: unknown; guide?: string
  }>
}

export function getActiveRules(segment?: string): Promise<ActiveRulesResponse> {
  const qs = segment ? `?segment=${segment}` : ''
  return req(`/rules/active${qs}`, {}, 'customer')
}

// ── Cases (customer) ──────────────────────────────────────────────────────────

export interface CaseResponse {
  id: string
  status: string
  entityCode?: string
  services: string[]
  closeReason?: string
  revisionRequestedFrom?: string
  pinnedQuestionIds: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export function createCase(): Promise<CaseResponse> {
  return req('/cases', { method: 'POST' }, 'customer')
}

export function getCase(id: string): Promise<CaseResponse> {
  return req(`/cases/${id}`, {}, 'customer')
}

export function submitFirstIntake(id: string, answers: Record<string, unknown>): Promise<CaseResponse> {
  return req(`/cases/${id}/intake/first/submit`, {
    method: 'POST', body: JSON.stringify({ answers }),
  }, 'customer')
}

export function submitSecondIntake(id: string, answers: Record<string, unknown>): Promise<CaseResponse> {
  return req(`/cases/${id}/intake/second/submit`, {
    method: 'POST', body: JSON.stringify({ answers }),
  }, 'customer')
}

export interface IntakeDto {
  caseId: string; phase: string; status: string
  answers: Record<string, unknown>; savedAt: string; submittedAt?: string
}

export function getIntake(id: string, phase: string): Promise<IntakeDto> {
  return req(`/cases/${id}/intake/${phase}`, {}, 'customer')
}

export function resubmit(id: string): Promise<CaseResponse> {
  return req(`/cases/${id}/resubmit`, { method: 'POST' }, 'customer')
}

// ── Documents (customer) ──────────────────────────────────────────────────────

export interface DocumentResponse {
  id: string; caseId: string; type: string; displayName: string
  status: string; required: boolean; isRequired?: boolean; latestFile: unknown | null
  openRevisions: unknown[]
}

export function getDocuments(caseId: string): Promise<DocumentResponse[]> {
  return req(`/cases/${caseId}/documents`, {}, 'customer')
}

export function uploadDocumentFile(caseId: string, docId: string, file: File): Promise<DocumentResponse> {
  const form = new FormData()
  form.append('file', file)
  const token = getCustomerToken()
  return fetch(`${BASE}/cases/${caseId}/documents/${docId}/file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then(async (res) => {
    if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => res.statusText))
    return res.json()
  })
}

// ── Internal cases ────────────────────────────────────────────────────────────

export interface CaseSummaryResponse {
  id: string; customerId: string; companyName?: string; status: string; entityCode?: string
  services: string[]; assigneeStaffId?: string
  createdAt: string; updatedAt: string
}

export interface InternalCaseDetailResponse {
  id: string; customerId: string; status: string; entityCode?: string
  services: string[]; segmentMeta: Record<string, unknown>
  pinnedQuestionIds: Record<string, unknown>; assigneeStaffId?: string
  closeReason?: string; revisionRequestedFrom?: string
  createdAt: string; updatedAt: string
  timeline: Array<Record<string, unknown>>
}

export function getInternalCases(status?: string): Promise<CaseSummaryResponse[]> {
  const qs = status ? `?status=${status}` : ''
  return req(`/internal/cases${qs}`, {}, 'staff')
}

export function getInternalCase(id: string): Promise<InternalCaseDetailResponse> {
  return req(`/internal/cases/${id}`, {}, 'staff')
}

export function advanceCase(id: string): Promise<CaseResponse> {
  return req(`/internal/cases/${id}/advance`, { method: 'POST' }, 'staff')
}

export function closeCase(id: string, reason: string): Promise<CaseResponse> {
  return req(`/internal/cases/${id}/close`, {
    method: 'POST', body: JSON.stringify({ reason }),
  }, 'staff')
}

// ── Internal documents ────────────────────────────────────────────────────────

export function requestRevision(docId: string, reason: string): Promise<DocumentResponse> {
  return req(`/internal/documents/${docId}/revision-requests`, {
    method: 'POST', body: JSON.stringify({ reason }),
  }, 'staff')
}

export function approveDocument(docId: string): Promise<DocumentResponse> {
  return req(`/internal/documents/${docId}/approve`, { method: 'POST' }, 'staff')
}
