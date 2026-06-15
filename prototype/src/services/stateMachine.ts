import type { CaseStatus, UserRole } from '../types'

interface TransitionRule {
  to: CaseStatus
  allowedRoles: UserRole[]
}

const TRANSITIONS: Record<CaseStatus, TransitionRule[]> = {
  INQUIRY_RECEIVED: [
    { to: 'SALES_REVIEW_REQUIRED', allowedRoles: ['CUSTOMER', 'SALES'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  SALES_REVIEW_REQUIRED: [
    { to: 'COMPLIANCE_REVIEW_REQUIRED', allowedRoles: ['SALES'] },
    { to: 'CLOSED', allowedRoles: ['SALES'] },
  ],
  COMPLIANCE_REVIEW_REQUIRED: [
    { to: 'OPS_REVIEW_REQUIRED', allowedRoles: ['COMPLIANCE'] },
    { to: 'SALES_REVIEW_REQUIRED', allowedRoles: ['COMPLIANCE'] }, // 반려
    { to: 'CLOSED', allowedRoles: ['COMPLIANCE'] },
  ],
  OPS_REVIEW_REQUIRED: [
    { to: 'COMPLETED', allowedRoles: ['OPS'] },
    { to: 'COMPLIANCE_REVIEW_REQUIRED', allowedRoles: ['OPS'] }, // 반려
    { to: 'CLOSED', allowedRoles: ['OPS', 'COMPLIANCE'] },
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
  SALES_REVIEW_REQUIRED: '영업 검토',
  COMPLIANCE_REVIEW_REQUIRED: '컴플라이언스 검토',
  OPS_REVIEW_REQUIRED: '운영 검토',
  COMPLETED: '온보딩 완료',
  CLOSED: '종료',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: '고객',
  SALES: '영업',
  COMPLIANCE: '컴플라이언스',
  OPS: '운영',
}
