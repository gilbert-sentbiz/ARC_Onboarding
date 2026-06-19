import type { Case, CaseStatus, IntakeRecord, UserRole, UserSession, OnboardingFormData } from '../types'
import { classify } from './segmentClassifier'
import { buildDocuments } from './documentRequirements'
import { canTransition, STATUS_LABELS, ROLE_LABELS } from './stateMachine'
import { useCaseStore } from '../store/caseStore'

const EMPTY_INTAKE: IntakeRecord = { status: 'not_started', data: {}, savedAt: 0 }

function makeCaseId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function saveFirstIntakeDraft(
  formData: Partial<OnboardingFormData>,
  session: UserSession
): Case {
  const store = useCaseStore.getState()
  const existing = store.findByEmail(session.email)
  const now = Date.now()

  if (existing && existing.firstIntake.status === 'draft') {
    store.updateCase(existing.id, {
      customerName: formData.contactName ?? existing.customerName,
      firstIntake: { status: 'draft', data: formData as Record<string, unknown>, savedAt: now },
    })
    return store.cases[existing.id]
  }

  const caseId = makeCaseId()
  const segmentInfo = classify({
    companyName: '', contactName: '', contactTitle: '', phone: '',
    email: session.email, services: [], collectionCountries: [],
    collectionOtherCountry: '', remittanceFrom: '', remittanceTo: '',
    businessType: '', foundingCountry: '', monthlyVolume: '',
    monthlyVolumeCurrency: 'USD', monthlyCount: '', referralSource: '',
    additionalNote: '',
    ...formData,
  })

  const c: Case = {
    id: caseId,
    createdAt: now,
    updatedAt: now,
    status: 'INQUIRY_RECEIVED',
    customerId: session.userId,
    customerName: formData.contactName ?? '',
    customerEmail: formData.email ?? session.email,
    segmentInfo,
    currentOwner: { role: 'CUSTOMER', name: formData.contactName ?? '' },
    firstIntake: { status: 'draft', data: formData as Record<string, unknown>, savedAt: now },
    secondIntake: { ...EMPTY_INTAKE },
    documents: [],
    messages: [],
    statusHistory: [
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: null,
        newStatus: 'INQUIRY_RECEIVED',
        changedAt: now,
        changedBy: { role: 'CUSTOMER', name: formData.contactName ?? '' },
      },
    ],
  }

  store.addCase(c)
  return c
}

export function createCase(formData: OnboardingFormData, session: UserSession): Case {
  const store = useCaseStore.getState()
  const existing = store.findByEmail(session.email)
  const now = Date.now()
  const segmentInfo = classify(formData)

  if (existing && existing.firstIntake.status === 'draft') {
    store.updateCase(existing.id, {
      customerName: formData.contactName,
      segmentInfo,
      currentOwner: { role: 'CUSTOMER', name: formData.contactName },
      firstIntake: { status: 'submitted', data: formData as unknown as Record<string, unknown>, savedAt: now },
      secondIntake: { ...EMPTY_INTAKE },
    })
    return store.cases[existing.id]
  }

  const caseId = makeCaseId()
  const c: Case = {
    id: caseId,
    createdAt: now,
    updatedAt: now,
    status: 'INQUIRY_RECEIVED',
    customerId: session.userId,
    customerName: formData.contactName,
    customerEmail: formData.email,
    segmentInfo,
    currentOwner: { role: 'CUSTOMER', name: formData.contactName },
    firstIntake: { status: 'submitted', data: formData as unknown as Record<string, unknown>, savedAt: now },
    secondIntake: { ...EMPTY_INTAKE },
    documents: [],
    messages: [],
    statusHistory: [
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: null,
        newStatus: 'INQUIRY_RECEIVED',
        changedAt: now,
        changedBy: { role: 'CUSTOMER', name: formData.contactName },
      },
    ],
  }

  store.addCase(c)
  return c
}

export function confirmSecondIntake(
  caseId: string,
  actorName: string
): { ok: boolean; error?: string } {
  const store = useCaseStore.getState()
  const c = store.cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }

  const now = Date.now()
  const documents = buildDocuments(caseId, c.segmentInfo, c.secondIntake.data as Record<string, unknown>)

  store.updateCase(caseId, {
    status: 'DOCUMENT_SUBMISSION_REQUIRED',
    currentOwner: { role: 'CUSTOMER', name: '고객' },
    secondIntake: { status: 'submitted', data: c.secondIntake.data, savedAt: now },
    documents,
    statusHistory: [
      ...c.statusHistory,
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: c.status,
        newStatus: 'DOCUMENT_SUBMISSION_REQUIRED',
        changedAt: now,
        changedBy: { role: 'CUSTOMER', name: actorName },
      },
    ],
  })

  return { ok: true }
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
    case 'DOCUMENT_SUBMISSION_REQUIRED': return { role: 'CUSTOMER', name: '고객' }
    case 'REVISION_REQUESTED': return { role: 'CUSTOMER', name: '고객' }
    case 'SALES_REVIEW_REQUIRED': return { role: 'SALES', name: '영업팀' }
    case 'COMPLIANCE_REVIEW_REQUIRED': return { role: 'COMPLIANCE', name: '컴플라이언스팀' }
    case 'OPS_REVIEW_REQUIRED': return { role: 'OPS', name: '운영팀' }
    default: return { role: 'OPS', name: '운영팀' }
  }
}
