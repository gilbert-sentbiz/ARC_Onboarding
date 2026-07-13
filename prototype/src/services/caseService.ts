import type { Case, CaseStatus, IntakeRecord, UserRole, UserSession, OnboardingFormData } from '../types'
import { classify, classifySectors } from './segmentClassifier'
import { buildDocuments } from './documentRequirements'
import { canTransition, STATUS_LABELS, ROLE_LABELS } from './stateMachine'
import { useCaseStore } from '../store/caseStore'
import { useInternalStaffStore } from '../store/internalStaffStore'
import { getRuleSet } from '../store/ruleStore'
import { emitNotification } from '../store/notificationStore'

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
    store.updateCase(existing.id, {
      customerName: formData.contactName ?? existing.customerName,
      segmentInfo,
      firstIntake: { status: 'draft', data: formData as Record<string, unknown>, savedAt: now },
    })
    return useCaseStore.getState().cases[existing.id]
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
    ruleSetVersion: getRuleSet().version,
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
    ruleSetVersion: getRuleSet().version,
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
  const secondData = c.secondIntake.data as Record<string, unknown>
  const sectors = classifySectors(secondData)
  const segmentInfo = { ...c.segmentInfo, sectors }
  const documents = buildDocuments(caseId, segmentInfo)

  store.updateCase(caseId, {
    status: 'DOCUMENT_SUBMISSION_REQUIRED',
    currentOwner: { role: 'CUSTOMER', name: '고객' },
    segmentInfo,
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
  const newOwner = resolveOwner(newStatus)
  state.updateCase(caseId, {
    status: newStatus,
    currentOwner: newOwner,
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

  // Notification: status change → next actor
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
  SALES_REVIEW_REQUIRED: 'SALES',
  COMPLIANCE_REVIEW_REQUIRED: 'COMPLIANCE',
  OPS_REVIEW_REQUIRED: 'OPS',
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
  const state = useCaseStore.getState()
  const c = state.cases[caseId]
  if (!c) return { ok: false, error: '케이스를 찾을 수 없습니다.' }
  const target: CaseStatus = c.revisionRequestedFrom ?? 'COMPLIANCE_REVIEW_REQUIRED'
  return transitionStatus(caseId, target, actor)
}

export function changeOwner(
  caseId: string,
  newOwnerName: string,
  actor: { role: UserRole; name: string }
): void {
  const state = useCaseStore.getState()
  const c = state.cases[caseId]
  if (!c) return
  const prevName = c.currentOwner.name
  const now = Date.now()
  state.updateCase(caseId, {
    currentOwner: { ...c.currentOwner, name: newOwnerName },
    statusHistory: [
      ...c.statusHistory,
      {
        id: `hist_${now}`,
        caseId,
        previousStatus: c.status,
        newStatus: c.status,
        changedAt: now,
        changedBy: actor,
        notes: `담당자 변경: ${prevName} → ${newOwnerName}`,
      },
    ],
  })
  emitNotification({
    type: 'ASSIGNED',
    caseId,
    caseLabel: c.customerName || c.customerEmail,
    message: `'${c.customerName || c.customerEmail}' 케이스 담당자로 지정되었습니다.`,
    recipient: { role: c.currentOwner.role, name: newOwnerName },
  })
}
