import type { Case, CaseStatus, UserRole, UserSession, OnboardingFormData } from '../types'
import { classify } from './segmentClassifier'
import { buildDocuments } from './documentRequirements'
import { canTransition, STATUS_LABELS, ROLE_LABELS } from './stateMachine'
import { useCaseStore } from '../store/caseStore'

export function createCase(formData: OnboardingFormData, session: UserSession): Case {
  const segmentInfo = classify(formData)
  const caseId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = Date.now()

  const c: Case = {
    id: caseId,
    createdAt: now,
    updatedAt: now,
    status: 'SALES_REVIEW_REQUIRED',
    customerId: session.userId,
    customerName: formData.contactName,
    customerEmail: formData.email,
    segmentInfo,
    currentOwner: { role: 'SALES', name: '영업팀' },
    documents: buildDocuments(caseId, segmentInfo),
    messages: [],
    statusHistory: [
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: null,
        newStatus: 'SALES_REVIEW_REQUIRED',
        changedAt: now,
        changedBy: { role: 'CUSTOMER', name: formData.contactName },
      },
    ],
  }

  useCaseStore.getState().addCase(c)
  return c
}

type TransitionResult = { ok: true } | { ok: false; error: string }

export function transitionStatus(
  caseId: string,
  newStatus: CaseStatus,
  actor: { role: UserRole; name: string },
  notes?: string
): TransitionResult {
  const state = useCaseStore.getState()
  const c = state.cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }

  if (!canTransition(c.status, newStatus, actor.role)) {
    return {
      ok: false,
      error: `${ROLE_LABELS[actor.role]}은(는) ${STATUS_LABELS[c.status]} → ${STATUS_LABELS[newStatus]} 전환 권한이 없습니다.`,
    }
  }

  const now = Date.now()
  state.updateCase(caseId, {
    status: newStatus,
    currentOwner: resolveOwner(newStatus),
    statusHistory: [
      ...c.statusHistory,
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: c.status,
        newStatus,
        changedAt: now,
        changedBy: actor,
        notes,
      },
    ],
  })

  return { ok: true }
}

function resolveOwner(status: CaseStatus): { role: UserRole; name: string } {
  switch (status) {
    case 'SALES_REVIEW_REQUIRED': return { role: 'SALES', name: '영업팀' }
    case 'COMPLIANCE_REVIEW_REQUIRED': return { role: 'COMPLIANCE', name: '컴플라이언스팀' }
    case 'OPS_REVIEW_REQUIRED': return { role: 'OPS', name: '운영팀' }
    default: return { role: 'OPS', name: '운영팀' }
  }
}
