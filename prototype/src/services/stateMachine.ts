import type { CaseStatus, UserRole } from '../types'

interface TransitionRule {
  to: CaseStatus
  allowedRoles: UserRole[]
}

// 4-stage review workflow: 영업(INITIAL_SCREENING) → 운영(DOCUMENT_SCREENING_REQUIRED) → 컴플(APPROVAL_REVIEW_REQUIRED) → 운영(ACCOUNT_SETUP_REQUIRED)
const TRANSITIONS: Record<CaseStatus, TransitionRule[]> = {
  INQUIRY_RECEIVED: [
    { to: 'DOCUMENT_SUBMISSION_REQUIRED', allowedRoles: ['CUSTOMER'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  DOCUMENT_SUBMISSION_REQUIRED: [
    { to: 'INITIAL_SCREENING', allowedRoles: ['CUSTOMER'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  INITIAL_SCREENING: [
    { to: 'DOCUMENT_SCREENING_REQUIRED', allowedRoles: ['SALES'] },
    { to: 'REVISION_REQUESTED', allowedRoles: ['SALES'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  DOCUMENT_SCREENING_REQUIRED: [
    { to: 'APPROVAL_REVIEW_REQUIRED', allowedRoles: ['OPS'] },
    { to: 'REVISION_REQUESTED', allowedRoles: ['OPS'] },
    { to: 'CLOSED', allowedRoles: ['OPS'] },
  ],
  APPROVAL_REVIEW_REQUIRED: [
    { to: 'ACCOUNT_SETUP_REQUIRED', allowedRoles: ['COMPLIANCE'] },
    { to: 'REVISION_REQUESTED', allowedRoles: ['COMPLIANCE'] },
    { to: 'DOCUMENT_SCREENING_REQUIRED', allowedRoles: ['COMPLIANCE'] }, // 반려
    { to: 'CLOSED', allowedRoles: ['COMPLIANCE'] },
  ],
  ACCOUNT_SETUP_REQUIRED: [
    { to: 'COMPLETED', allowedRoles: ['OPS'] },
    { to: 'APPROVAL_REVIEW_REQUIRED', allowedRoles: ['OPS'] }, // 반려
    { to: 'CLOSED', allowedRoles: ['OPS', 'COMPLIANCE'] },
  ],
  REVISION_REQUESTED: [
    { to: 'INITIAL_SCREENING', allowedRoles: ['CUSTOMER', 'SALES'] },
    { to: 'DOCUMENT_SCREENING_REQUIRED', allowedRoles: ['CUSTOMER', 'OPS'] },
    { to: 'APPROVAL_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER', 'COMPLIANCE'] },
    { to: 'CLOSED', allowedRoles: ['COMPLIANCE', 'OPS', 'SALES'] },
  ],
  COMPLETED: [
    { to: 'CLOSED', allowedRoles: ['OPS', 'SALES'] },
  ],
  CLOSED: [],
}

export function canTransition(from: CaseStatus, to: CaseStatus, role: UserRole): boolean {
  return (TRANSITIONS[from] ?? []).some(t => t.to === to && t.allowedRoles.includes(role))
}

export function availableTransitions(current: CaseStatus, role: UserRole): CaseStatus[] {
  return (TRANSITIONS[current] ?? [])
    .filter(t => t.allowedRoles.includes(role))
    .map(t => t.to)
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  INQUIRY_RECEIVED: '문의 접수',
  DOCUMENT_SUBMISSION_REQUIRED: '서류 제출 대기',
  INITIAL_SCREENING: '1차 스크리닝',
  DOCUMENT_SCREENING_REQUIRED: '서류 스크리닝',
  APPROVAL_REVIEW_REQUIRED: '심사, 승인 필요',
  ACCOUNT_SETUP_REQUIRED: '계정 개설 필요',
  REVISION_REQUESTED: '보완 요청',
  COMPLETED: '온보딩 완료',
  CLOSED: '종료',
}

export const STATUS_ORDER: CaseStatus[] = [
  'INQUIRY_RECEIVED',
  'DOCUMENT_SUBMISSION_REQUIRED',
  'INITIAL_SCREENING',
  'DOCUMENT_SCREENING_REQUIRED',
  'APPROVAL_REVIEW_REQUIRED',
  'ACCOUNT_SETUP_REQUIRED',
  'REVISION_REQUESTED',
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
