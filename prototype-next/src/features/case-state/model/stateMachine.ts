import type { CaseStatus, UserRole } from '@/src/shared/type'

type TransitionRule = {
  to: CaseStatus
  allowedRoles: UserRole[]
}

const TRANSITIONS: Record<CaseStatus, TransitionRule[]> = {
  INQUIRY_RECEIVED: [
    { to: 'DOCUMENT_SUBMISSION_REQUIRED', allowedRoles: ['CUSTOMER'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  DOCUMENT_SUBMISSION_REQUIRED: [
    { to: 'SALES_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  SALES_REVIEW_REQUIRED: [
    { to: 'COMPLIANCE_REVIEW_REQUIRED', allowedRoles: ['SALES'] },
    { to: 'REVISION_REQUESTED', allowedRoles: ['SALES'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  COMPLIANCE_REVIEW_REQUIRED: [
    { to: 'OPS_REVIEW_REQUIRED', allowedRoles: ['COMPLIANCE'] },
    { to: 'REVISION_REQUESTED', allowedRoles: ['COMPLIANCE'] },
    { to: 'SALES_REVIEW_REQUIRED', allowedRoles: ['COMPLIANCE'] }, // 반려
    { to: 'CLOSED', allowedRoles: ['COMPLIANCE'] },
  ],
  REVISION_REQUESTED: [
    { to: 'COMPLIANCE_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER', 'COMPLIANCE'] },
    { to: 'SALES_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER'] },
    { to: 'OPS_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER'] },
    { to: 'CLOSED', allowedRoles: ['COMPLIANCE'] },
  ],
  OPS_REVIEW_REQUIRED: [
    { to: 'COMPLETED', allowedRoles: ['OPS'] },
    { to: 'COMPLIANCE_REVIEW_REQUIRED', allowedRoles: ['OPS'] }, // 반려
    { to: 'REVISION_REQUESTED', allowedRoles: ['OPS'] },
    { to: 'CLOSED', allowedRoles: ['OPS', 'COMPLIANCE'] },
  ],
  COMPLETED: [{ to: 'CLOSED', allowedRoles: ['OPS', 'SALES'] }],
  CLOSED: [],
}

export function canTransition(from: CaseStatus, to: CaseStatus, role: UserRole): boolean {
  return (TRANSITIONS[from] ?? []).some((t) => t.to === to && t.allowedRoles.includes(role))
}

export function availableTransitions(current: CaseStatus, role: UserRole): CaseStatus[] {
  return (TRANSITIONS[current] ?? []).filter((t) => t.allowedRoles.includes(role)).map((t) => t.to)
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  INQUIRY_RECEIVED: '문의 접수',
  DOCUMENT_SUBMISSION_REQUIRED: '서류 제출 대기',
  SALES_REVIEW_REQUIRED: '영업 검토',
  COMPLIANCE_REVIEW_REQUIRED: '컴플라이언스 검토',
  REVISION_REQUESTED: '보완 요청',
  OPS_REVIEW_REQUIRED: '운영 검토',
  COMPLETED: '온보딩 완료',
  CLOSED: '종료',
}

// §8.3 — 영업은 DOCUMENT_SUBMISSION_REQUIRED 이후 케이스 열람 가능
export const STATUS_ORDER: CaseStatus[] = [
  'INQUIRY_RECEIVED',
  'DOCUMENT_SUBMISSION_REQUIRED',
  'SALES_REVIEW_REQUIRED',
  'COMPLIANCE_REVIEW_REQUIRED',
  'REVISION_REQUESTED',
  'OPS_REVIEW_REQUIRED',
  'COMPLETED',
  'CLOSED',
]

const MIN_VIEW_INDEX: Partial<Record<UserRole, number>> = {
  SALES: STATUS_ORDER.indexOf('DOCUMENT_SUBMISSION_REQUIRED'),
  COMPLIANCE: STATUS_ORDER.indexOf('DOCUMENT_SUBMISSION_REQUIRED'),
  OPS: STATUS_ORDER.indexOf('DOCUMENT_SUBMISSION_REQUIRED'),
}

export function canView(status: CaseStatus, role: UserRole): boolean {
  if (role === 'CUSTOMER') return true
  const minIdx = MIN_VIEW_INDEX[role]
  if (minIdx === undefined) return false
  return STATUS_ORDER.indexOf(status) >= minIdx
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: '고객',
  SALES: '영업',
  COMPLIANCE: '컴플라이언스',
  OPS: '운영',
}
