import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import { getRuleSet } from '../../../store/ruleStore'
import type { ServiceCode, EntityCode, QuestionRule } from '../../../types'
import CorporateForm from './CorporateForm'
import IndividualForm from './IndividualForm'
import FIForm from './FIForm'
import KRWCollectionSection from './KRWCollectionSection'
import VNDCollectionSection from './VNDCollectionSection'
import DynamicQuestionsSection from './DynamicQuestionsSection'

type Stage = 'entity' | 'entity_questions' | 'krw' | 'krw_questions' | 'vnd' | 'vnd_questions'

function getSegmentQuestions(configKey: string): QuestionRule[] {
  const rs = getRuleSet()
  const config = rs.segmentQuestionConfigs.find(c => c.key === configKey)
  if (!config) return []
  const enabled = rs.questionPool.filter(
    q => q.classification === 'common' && config.enabledCommonQuestionIds.includes(q.id)
  )
  return [...enabled, ...config.ownQuestions]
}

function getEntityFixedQuestions(entityCode: EntityCode): QuestionRule[] {
  const rs = getRuleSet()
  return rs.questionPool.filter(q => q.classification === 'entity' && q.scopeEntity === entityCode)
}

export default function InformationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  const [stage, setStage] = useState<Stage>('entity')
  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(() => {
    if (c?.secondIntake?.status === 'draft') {
      return c.secondIntake.data as Record<string, unknown>
    }
    const fi = (c?.firstIntake?.data ?? {}) as Record<string, unknown>
    const rawSeg = (c?.segmentInfo as unknown as Record<string, unknown>) ?? {}
    const seg = (rawSeg.entity ?? rawSeg.entitySegment ?? rawSeg.customerType) as string | undefined
    const fiServices = Array.isArray(fi.services) ? (fi.services as string[]) : []
    const fiColl = Array.isArray(fi.collectionCountries) ? (fi.collectionCountries as string[]) : []
    const fiServiceCodes = Array.isArray(rawSeg.services) ? (rawSeg.services as string[]) : []
    const fiServiceSegs = Array.isArray(rawSeg.serviceSegments) ? (rawSeg.serviceSegments as string[]) : []

    const entityInit: Record<string, unknown> = {}
    if (seg === 'ENTITY_CORP' || seg === 'SentBiz Corporate') {
      if (fi.companyName) entityInit.companyNameKr = fi.companyName
      if (fi.phone) entityInit.phone = fi.phone
      if (fi.foundingCountry) entityInit.corpNationality = fi.foundingCountry
    } else if (seg === 'ENTITY_INDIV' || seg === 'SentBiz Individual') {
      if (fi.companyName) entityInit.bizName = fi.companyName
      if (fi.phone) entityInit.phone = fi.phone
    } else if (seg === 'ENTITY_FI' || seg === 'FI') {
      if (fi.companyName) entityInit.legalName = fi.companyName
      if (fi.foundingCountry) entityInit.incorpCountry = fi.foundingCountry
      if (fi.phone) entityInit.repPhone = fi.phone
      if (fi.email) entityInit.repEmail = fi.email
      const fiBServices: string[] = []
      if (fiServices.includes('collection')) fiBServices.push('collection')
      if (fiServices.includes('remittance')) fiBServices.push('payout')
      if (fiBServices.length > 0) entityInit.services = fiBServices
      const fiCurrencies = fiColl.filter((v) => v !== 'OTHER')
      if (fiCurrencies.length > 0) entityInit.collectionCurrencies = fiCurrencies
      if (fi.remittanceFrom) entityInit.originCountries = fi.remittanceFrom
    }

    const result: Record<string, unknown> = {}
    if (Object.keys(entityInit).length > 0) result.entity = entityInit
    if (fiServiceCodes.includes('SVC_VND') || fiServiceSegs.includes('VND Collection')) {
      const vndInit: Record<string, unknown> = {}
      if (fi.companyName) vndInit.entityName = fi.companyName
      if (fi.foundingCountry) vndInit.placeOfIncorp = fi.foundingCountry
      if (fi.contactName) vndInit.contactName = fi.contactName
      if (fi.phone) vndInit.contactPhone = fi.phone
      if (fi.email) vndInit.contactEmail = fi.email
      if (fi.monthlyVolume) vndInit.monthlyVolume = fi.monthlyVolume
      if (Object.keys(vndInit).length > 0) result.vndCollection = vndInit
    }
    return result
  })

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const raw = c.segmentInfo as unknown as Record<string, unknown>
  const entitySegment = (raw.entity ?? raw.entitySegment ?? raw.customerType) as string | undefined
  const serviceCodes = Array.isArray(raw.services) ? raw.services as ServiceCode[] : []
  const serviceSegsLegacy = Array.isArray(raw.serviceSegments) ? raw.serviceSegments as string[] : []
  const needsKRW = serviceCodes.includes('SVC_KRW') || serviceSegsLegacy.includes('KRW Collection')
  const needsVND = serviceCodes.includes('SVC_VND') || serviceSegsLegacy.includes('VND Collection')

  // Resolve RuleSet-driven questions per segment
  const entityCode = entitySegment as EntityCode | undefined
  const entityCommonQs = entityCode ? getSegmentQuestions(`entity:${entityCode}`) : []
  const entityFixedQs  = entityCode ? getEntityFixedQuestions(entityCode) : []
  const entityDynamicQuestions = [...entityCommonQs, ...entityFixedQs]

  const krwDynamicQuestions  = needsKRW ? getSegmentQuestions('service:SVC_KRW')  : []
  const vndDynamicQuestions  = needsVND ? getSegmentQuestions('service:SVC_VND')  : []

  function saveDraft(partial: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { secondIntake: { status: 'draft', data: partial, savedAt: Date.now() } })
  }

  function saveAndNavigate(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { secondIntake: { status: 'draft', data, savedAt: Date.now() } })
    navigate(`/customer/case/${id}/review/second`)
  }

  function afterEntity(next: Record<string, unknown>) {
    if (entityDynamicQuestions.length > 0) { setStage('entity_questions'); window.scrollTo({ top: 0 }) }
    else if (needsKRW) { setStage('krw'); window.scrollTo({ top: 0 }) }
    else if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function afterEntityQuestions(next: Record<string, unknown>) {
    if (needsKRW) { setStage('krw'); window.scrollTo({ top: 0 }) }
    else if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function afterKRW(next: Record<string, unknown>) {
    if (krwDynamicQuestions.length > 0) { setStage('krw_questions'); window.scrollTo({ top: 0 }) }
    else if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function afterKRWQuestions(next: Record<string, unknown>) {
    if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function afterVND(next: Record<string, unknown>) {
    if (vndDynamicQuestions.length > 0) { setStage('vnd_questions'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  // ── Stage renderers ───────────────────────────────────────────────────────

  if (stage === 'entity_questions')
    return (
      <DynamicQuestionsSection
        title="추가 정보 입력"
        questions={entityDynamicQuestions}
        initialData={(accumulated.entityQuestions as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, entityQuestions: d }
          setAccumulated(next)
          afterEntityQuestions(next)
        }}
        onBack={() => setStage('entity')}
        onDraftSave={(d) => saveDraft({ ...accumulated, entityQuestions: d })}
      />
    )

  if (stage === 'krw')
    return (
      <KRWCollectionSection
        initialData={(accumulated.krwCollection as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, krwCollection: d }
          setAccumulated(next)
          afterKRW(next)
        }}
        onBack={() => {
          if (entityDynamicQuestions.length > 0) setStage('entity_questions')
          else setStage('entity')
        }}
        onDraftSave={(d) => saveDraft({ ...accumulated, krwCollection: d })}
      />
    )

  if (stage === 'krw_questions')
    return (
      <DynamicQuestionsSection
        title="KRW Collection 추가 정보"
        questions={krwDynamicQuestions}
        initialData={(accumulated.krwQuestions as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, krwQuestions: d }
          setAccumulated(next)
          afterKRWQuestions(next)
        }}
        onBack={() => setStage('krw')}
        onDraftSave={(d) => saveDraft({ ...accumulated, krwQuestions: d })}
      />
    )

  if (stage === 'vnd')
    return (
      <VNDCollectionSection
        initialData={(accumulated.vndCollection as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, vndCollection: d }
          setAccumulated(next)
          afterVND(next)
        }}
        onBack={() => {
          if (krwDynamicQuestions.length > 0) setStage('krw_questions')
          else if (needsKRW) setStage('krw')
          else if (entityDynamicQuestions.length > 0) setStage('entity_questions')
          else setStage('entity')
        }}
        onDraftSave={(d) => saveDraft({ ...accumulated, vndCollection: d })}
      />
    )

  if (stage === 'vnd_questions')
    return (
      <DynamicQuestionsSection
        title="VND Collection 추가 정보"
        questions={vndDynamicQuestions}
        initialData={(accumulated.vndQuestions as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, vndQuestions: d }
          setAccumulated(next)
          saveAndNavigate(next)
        }}
        onBack={() => setStage('vnd')}
        onDraftSave={(d) => saveDraft({ ...accumulated, vndQuestions: d })}
      />
    )

  // entity stage (default)
  const serviceSegmentsForForm = serviceCodes.length > 0
    ? serviceCodes.map(c => ({ 'SVC_KRW': 'KRW Collection', 'SVC_VND': 'VND Collection', 'SVC_OTHER_COLL': '기타 Collection', 'SVC_PAYOUT': 'Payout' }[c] ?? c))
    : serviceSegsLegacy

  const entityProps = {
    serviceSegments: serviceSegmentsForForm as string[],
    initialData: (accumulated.entity as Record<string, unknown>) ?? {},
    onDraftSave: (d: Record<string, unknown>) => saveDraft({ ...accumulated, entity: d }),
  }

  function handleEntityComplete(data: Record<string, unknown>) {
    const next = { ...accumulated, entity: data }
    setAccumulated(next)
    afterEntity(next)
  }

  if (entitySegment === 'ENTITY_CORP' || entitySegment === 'SentBiz Corporate')
    return <CorporateForm {...entityProps} onComplete={handleEntityComplete} />
  if (entitySegment === 'ENTITY_INDIV' || entitySegment === 'SentBiz Individual')
    return <IndividualForm {...entityProps} onComplete={handleEntityComplete} />
  if (entitySegment === 'ENTITY_FI' || entitySegment === 'FI')
    return <FIForm {...entityProps} onComplete={handleEntityComplete} />

  navigate('/customer/onboarding', { replace: true })
  return null
}
