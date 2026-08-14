// Backend API DTO types — source of truth: docs/API-SPEC.md §3
// These are contract types that map directly to backend typed data classes.

export type CaseResponse = {
  id: string
  status: string
  entityCode: string | null
  services: string[]
  closeReason: string | null
  revisionRequestedFrom: string | null
  pinnedQuestionIds: { first: string[]; second: string[] }
  createdAt: string
  updatedAt: string
}

export type CaseSummaryResponse = {
  id: string
  companyName: string
  status: string
  entityCode: string
  services: string[]
  waitingDays: number
  assigneeStaffId: string | null
  updatedAt: string
}

export type InternalCaseResponse = CaseResponse & {
  segmentMeta: Record<string, unknown>
  assigneeStaffId: string | null
  timeline: CaseEventResponse[]
}

export type CaseEventResponse = {
  id: string
  eventType: string
  actorType: string
  actorId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

export type IntakeResponse = {
  caseId: string
  phase: string
  status: string
  answers: Record<string, unknown>
  savedAt: string
  submittedAt: string | null
}

export type DocumentResponse = {
  id: string
  caseId: string
  type: string
  displayName: string
  status: string
  isRequired: boolean
  latestFile: DocumentFileResponse | null
  openRevisionReason: string | null
}

export type DocumentFileResponse = {
  id: string
  documentId: string
  fileName: string
  fileSize: number
  mimeType: string
  isLatest: boolean
  uploadedAt: string
  uploaderType: string
}

export type RevisionResponse = {
  id: string
  documentId: string
  reason: string
  requestedFromStatus: string
  requestedAt: string
  resolvedAt: string | null
}

export type ActiveRulesResponse = {
  segments: SegmentDto[]
  questions: QuestionDto[]
  docTemplates: DocTemplateDto[]
}

export type SegmentDto = {
  id: string
  axis: string
  code: string
  label: string
}

export type QuestionDto = {
  id: string
  code: string
  phase: string
  classification: string
  ownerSegmentId: string | null
  label: string
  inputType: string
  options: unknown[] | null
  isRequired: boolean
  showWhen: Record<string, unknown> | null
  repeat: boolean
  parentQuestionId: string | null
  displayOrder: number
}

export type DocTemplateDto = {
  id: string
  type: string
  displayName: string
  classification: string
  ownerSegmentId: string | null
  isRequired: boolean
  isConditional: boolean
  condition: Record<string, unknown> | null
  guide: string | null
}

export type AuthSessionResponse = {
  token: string
  role: string | null
  expiresAt: string
}

// Request types
export type OtpRequest = { email: string }
export type OtpVerifyRequest = { email: string; code: string }
export type IntakeAnswersRequest = { answers: Record<string, unknown> }
export type CloseRequest = { reason: 'DROPPED' | 'EXITED' }
export type MockLoginRequest = { email: string; role: string }
export type RevisionRequest = { reason: string }
