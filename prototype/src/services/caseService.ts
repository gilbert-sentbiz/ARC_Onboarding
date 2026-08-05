import type { Case, CaseStatus, UserRole, UserSession, OnboardingFormData, IntakeResponse, Document } from '../types'
import { classify, classifySectors } from './segmentClassifier'
import { buildDocuments } from './documentRequirements'
import { canTransition, STATUS_LABELS, ROLE_LABELS } from './stateMachine'
import { useCaseStore } from '../store/caseStore'
import { useIntakeResponseStore, makeIntakeId } from '../store/intakeResponseStore'
import { useDocumentStore } from '../store/documentStore'
import { useCaseEventStore } from '../store/caseEventStore'
import { useRevisionRequestStore } from '../store/revisionRequestStore'
import { useInternalStaffStore } from '../store/internalStaffStore'
import { getRuleSet } from '../store/ruleStore'
import { emitNotification } from '../store/notificationStore'

function makeCaseId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function makeEventId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getIntakeResponse(caseId: string, phase: 'first' | 'second'): IntakeResponse | null {
  return useIntakeResponseStore.getState().getByCase(caseId, phase)
}

export function getDocuments(caseId: string): Document[] {
  return useDocumentStore.getState().getByCase(caseId)
}

// ── Write operations ──────────────────────────────────────────────────────────

export function saveFirstIntakeDraft(
  formData: Partial<OnboardingFormData>,
  session: UserSession
): Case {
  const caseStore = useCaseStore.getState()
  const intakeStore = useIntakeResponseStore.getState()
  const existing = caseStore.findByEmail(session.email)
  const now = Date.now()

  if (existing) {
    const existingIntake = intakeStore.getByCase(existing.id, 'first')
    if (existingIntake && existingIntake.status === 'draft') {
      const segmentInfo = classify({
        companyName: formData.companyName ?? '',
        contactName: formData.contactName ?? '',
        contactTitle: formData.contactTitle ?? '',
        phone: formData.phone ?? '',
        email: session.email,
        services: Array.isArray(formData.services) ? formData.services : [],
        collectionCountries: Array.isArray(formData.collectionCountries) ? formData.collectionCountries : [],
        collectionOtherCountry: formData.collectionOtherCountry ?? '',
        remittanceFrom: formData.remittanceFrom ?? '',
        remittanceTo: formData.remittanceTo ?? '',
        businessType: formData.businessType ?? '',
        foundingCountry: formData.foundingCountry ?? '',
        monthlyVolume: formData.monthlyVolume ?? '',
        monthlyVolumeCurrency: formData.monthlyVolumeCurrency ?? 'USD',
        monthlyCount: formData.monthlyCount ?? '',
        referralSource: formData.referralSource ?? '',
        additionalNote: formData.additionalNote ?? '',
      })
      caseStore.updateCase(existing.id, {
        customerName: formData.contactName ?? existing.customerName,
        segmentInfo,
      })
      intakeStore.upsert({
        ...existingIntake,
        status: 'draft',
        answers: formData as Record<string, unknown>,
        savedAt: now,
      })
      return useCaseStore.getState().cases[existing.id]
    }
  }

  const caseId = makeCaseId()
  const segmentInfo = classify({
    companyName: '', contactName: '', contactTitle: '', phone: '',
    email: session.email, services: [], collectionCountries: [],
    collectionOtherCountry: '', remittanceFrom: '', remittanceTo: '',
    businessType: '', foundingCountry: '', monthlyVolume: '', monthlyCount: '',
    monthlyVolumeCurrency: 'USD', referralSource: '',
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
    ruleSetVersion: getRuleSet().version,
    currentOwner: { role: 'CUSTOMER', name: formData.contactName ?? '' },
  }

  caseStore.addCase(c)

  intakeStore.upsert({
    id: makeIntakeId(caseId, 'first'),
    caseId,
    phase: 'first',
    status: 'draft',
    answers: formData as Record<string, unknown>,
    savedAt: now,
  })

  intakeStore.upsert({
    id: makeIntakeId(caseId, 'second'),
    caseId,
    phase: 'second',
    status: 'not_started',
    answers: {},
    savedAt: now,
  })

  useCaseEventStore.getState().append({
    id: makeEventId('evt'),
    caseId,
    eventType: 'CASE_CREATED',
    actorType: 'CUSTOMER',
    actorRole: 'CUSTOMER',
    actorName: formData.contactName ?? '',
    payload: { newStatus: 'INQUIRY_RECEIVED' },
    createdAt: now,
  })

  return useCaseStore.getState().cases[caseId]
}

export function createCase(formData: OnboardingFormData, session: UserSession): Case {
  const caseStore = useCaseStore.getState()
  const intakeStore = useIntakeResponseStore.getState()
  const existing = caseStore.findByEmail(session.email)
  const now = Date.now()
  const segmentInfo = classify(formData)

  if (existing) {
    const existingIntake = intakeStore.getByCase(existing.id, 'first')
    if (existingIntake && existingIntake.status === 'draft') {
      caseStore.updateCase(existing.id, {
        customerName: formData.contactName,
        segmentInfo,
        currentOwner: { role: 'CUSTOMER', name: formData.contactName },
      })
      intakeStore.upsert({
        ...existingIntake,
        status: 'submitted',
        answers: formData as unknown as Record<string, unknown>,
        savedAt: now,
        submittedAt: now,
      })
      return useCaseStore.getState().cases[existing.id]
    }
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
    ruleSetVersion: getRuleSet().version,
    currentOwner: { role: 'CUSTOMER', name: formData.contactName },
  }

  caseStore.addCase(c)

  intakeStore.upsert({
    id: makeIntakeId(caseId, 'first'),
    caseId,
    phase: 'first',
    status: 'submitted',
    answers: formData as unknown as Record<string, unknown>,
    savedAt: now,
    submittedAt: now,
  })

  intakeStore.upsert({
    id: makeIntakeId(caseId, 'second'),
    caseId,
    phase: 'second',
    status: 'not_started',
    answers: {},
    savedAt: now,
  })

  useCaseEventStore.getState().append({
    id: makeEventId('evt'),
    caseId,
    eventType: 'CASE_CREATED',
    actorType: 'CUSTOMER',
    actorRole: 'CUSTOMER',
    actorName: formData.contactName,
    payload: { newStatus: 'INQUIRY_RECEIVED' },
    createdAt: now,
  })

  return useCaseStore.getState().cases[caseId]
}

export function saveSecondIntakeDraft(caseId: string, answers: Record<string, unknown>): void {
  const intakeStore = useIntakeResponseStore.getState()
  const existing = intakeStore.getByCase(caseId, 'second')
  const now = Date.now()
  intakeStore.upsert({
    id: makeIntakeId(caseId, 'second'),
    caseId,
    phase: 'second',
    status: 'draft',
    answers,
    savedAt: now,
    ...(existing?.submittedAt ? { submittedAt: existing.submittedAt } : {}),
  })
}

export function confirmSecondIntake(
  caseId: string,
  actorName: string
): { ok: boolean; error?: string } {
  const caseStore = useCaseStore.getState()
  const intakeStore = useIntakeResponseStore.getState()
  const c = caseStore.cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }

  const now = Date.now()
  const secondIntake = intakeStore.getByCase(caseId, 'second')
  const secondData = (secondIntake?.answers ?? {}) as Record<string, unknown>
  const sectors = classifySectors(secondData)
  const segmentInfo = { ...c.segmentInfo, sectors }
  const builtDocuments = buildDocuments(caseId, segmentInfo)

  caseStore.updateCase(caseId, {
    status: 'DOCUMENT_SUBMISSION_REQUIRED',
    currentOwner: { role: 'CUSTOMER', name: '고객' },
    segmentInfo,
  })

  intakeStore.upsert({
    id: makeIntakeId(caseId, 'second'),
    caseId,
    phase: 'second',
    status: 'submitted',
    answers: secondData,
    savedAt: now,
    submittedAt: now,
  })

  useDocumentStore.getState().addDocuments(builtDocuments)

  useCaseEventStore.getState().append({
    id: makeEventId('evt'),
    caseId,
    eventType: 'CASE_STATUS_CHANGED',
    actorType: 'CUSTOMER',
    actorRole: 'CUSTOMER',
    actorName,
    payload: { previousStatus: c.status, newStatus: 'DOCUMENT_SUBMISSION_REQUIRED' },
    createdAt: now,
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
  const caseStore = useCaseStore.getState()
  const c = caseStore.cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }

  if (!canTransition(c.status, newStatus, actor.role)) {
    return {
      ok: false,
      error: `${ROLE_LABELS[actor.role]}은(는) ${STATUS_LABELS[c.status]} → ${STATUS_LABELS[newStatus]} 전환 권한이 없습니다.`,
    }
  }

  const now = Date.now()
  const newOwner = resolveOwner(newStatus)
  caseStore.updateCase(caseId, { status: newStatus, currentOwner: newOwner })

  useCaseEventStore.getState().append({
    id: makeEventId('evt'),
    caseId,
    eventType: 'CASE_STATUS_CHANGED',
    actorType: actor.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF',
    actorRole: actor.role,
    actorName: actor.name,
    payload: { previousStatus: c.status, newStatus, notes },
    createdAt: now,
  })

  const label = c.customerName || c.customerEmail
  const statusLabel = STATUS_LABELS[newStatus]
  if (newStatus === 'REVISION_REQUESTED' || newStatus === 'DOCUMENT_SUBMISSION_REQUIRED') {
    emitNotification({
      type: 'REVISION_REQUESTED',
      caseId,
      caseLabel: label,
      message: `'${label}' 케이스에 서류 보완이 요청되었습니다.`,
      recipient: { role: 'CUSTOMER', userId: c.customerId },
    })
  } else if (newStatus === 'COMPLETED') {
    emitNotification({
      type: 'STATUS_CHANGED',
      caseId,
      caseLabel: label,
      message: `'${label}' 온보딩이 완료되었습니다.`,
      recipient: { role: 'CUSTOMER', userId: c.customerId },
    })
  } else if (newStatus === 'CLOSED') {
    emitNotification({
      type: 'STATUS_CHANGED',
      caseId,
      caseLabel: label,
      message: `'${label}' 케이스가 종료되었습니다.`,
      recipient: { role: 'CUSTOMER', userId: c.customerId },
    })
  } else if (newOwner.role !== 'CUSTOMER') {
    emitNotification({
      type: 'STATUS_CHANGED',
      caseId,
      caseLabel: label,
      message: `'${label}' 케이스가 '${statusLabel}' 단계로 이동했습니다.`,
      recipient: { role: newOwner.role, name: newOwner.name },
    })
  }

  return { ok: true }
}

const ROLE_FOR_STATUS: Partial<Record<CaseStatus, 'SALES' | 'COMPLIANCE' | 'OPS'>> = {
  INITIAL_SCREENING: 'SALES',
  DOCUMENT_SCREENING_REQUIRED: 'OPS',
  APPROVAL_REVIEW_REQUIRED: 'COMPLIANCE',
  ACCOUNT_SETUP_REQUIRED: 'OPS',
}

function resolveOwner(newStatus: CaseStatus): { role: UserRole; name: string } {
  const targetRole = ROLE_FOR_STATUS[newStatus]
  if (targetRole) {
    const staff = useInternalStaffStore.getState().staff.filter(s => s.role === targetRole)
    if (staff.length > 0) {
      const cases = Object.values(useCaseStore.getState().cases)
      const counts = staff.map(s =>
        cases.filter(c => c.currentOwner.role === targetRole && c.currentOwner.name === s.name).length
      )
      const minIdx = counts.indexOf(Math.min(...counts))
      return { role: targetRole, name: staff[minIdx].name }
    }
  }
  switch (newStatus) {
    case 'DOCUMENT_SUBMISSION_REQUIRED':
    case 'REVISION_REQUESTED':
      return { role: 'CUSTOMER', name: '고객' }
    default:
      return { role: 'OPS', name: '운영팀' }
  }
}

export function resubmitRevision(
  caseId: string,
  actor: { role: UserRole; name: string }
): TransitionResult {
  const c = useCaseStore.getState().cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }
  const target: CaseStatus = c.revisionRequestedFrom ?? 'APPROVAL_REVIEW_REQUIRED'

  const now = Date.now()
  const revStore = useRevisionRequestStore.getState()
  const docs = useDocumentStore.getState().getByCase(caseId)
  for (const doc of docs) {
    const active = revStore.getActiveByDocument(doc.id)
    for (const r of active) revStore.resolve(r.id, now)
  }

  return transitionStatus(caseId, target, actor)
}

export function changeOwner(
  caseId: string,
  newOwnerName: string,
  actor: { role: UserRole; name: string }
): void {
  const caseStore = useCaseStore.getState()
  const c = caseStore.cases[caseId]
  if (!c) return
  const prevName = c.currentOwner.name
  const now = Date.now()
  caseStore.updateCase(caseId, {
    currentOwner: { ...c.currentOwner, name: newOwnerName },
  })

  useCaseEventStore.getState().append({
    id: makeEventId('evt'),
    caseId,
    eventType: 'ASSIGNEE_CHANGED',
    actorType: 'STAFF',
    actorRole: actor.role,
    actorName: actor.name,
    payload: { notes: `담당자 변경: ${prevName} → ${newOwnerName}` },
    createdAt: now,
  })

  emitNotification({
    type: 'ASSIGNED',
    caseId,
    caseLabel: c.customerName || c.customerEmail,
    message: `'${c.customerName || c.customerEmail}' 케이스 담당자로 지정되었습니다.`,
    recipient: { role: c.currentOwner.role, name: newOwnerName },
  })
}
