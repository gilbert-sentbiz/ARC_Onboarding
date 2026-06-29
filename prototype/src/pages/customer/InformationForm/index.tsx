import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import { getRuleSet } from '../../../store/ruleStore'
import type { ServiceCode, EntityCode, QuestionRule } from '../../../types'
import DynamicQuestionsSection from './DynamicQuestionsSection'

type Stage = 'entity_questions' | 'vnd_questions'

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
  return rs.questionPool.filter(q => q.classification === 'entity-own' && (q.scope === entityCode || q.scopeEntity === entityCode))
}

export default function InformationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  const [stage, setStage] = useState<Stage>('entity_questions')
  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(() => {
    if (c?.secondIntake?.status === 'draft') {
      return c.secondIntake.data as Record<string, unknown>
    }
    // Autofill from 1st-intake using question IDs
    const fi = (c?.firstIntake?.data ?? {}) as Record<string, unknown>
    const rawSeg = (c?.segmentInfo as unknown as Record<string, unknown>) ?? {}
    const seg = (rawSeg.entity ?? rawSeg.entitySegment ?? rawSeg.customerType) as string | undefined
    const fiServiceCodes = Array.isArray(rawSeg.services) ? (rawSeg.services as string[]) : []
    const fiServiceSegs = Array.isArray(rawSeg.serviceSegments) ? (rawSeg.serviceSegments as string[]) : []

    const entityInit: Record<string, string> = {}
    if (seg === 'ENTITY_CORP' || seg === 'SentBiz Corporate') {
      if (fi.companyName) entityInit['qe_corp_name_kr'] = fi.companyName as string
      if (fi.phone) entityInit['qe_corp_phone'] = fi.phone as string
      if (fi.foundingCountry) entityInit['qe_corp_nation'] = fi.foundingCountry as string
    } else if (seg === 'ENTITY_INDIV' || seg === 'SentBiz Individual') {
      if (fi.companyName) entityInit['qe_indiv_biz_name'] = fi.companyName as string
      if (fi.phone) entityInit['qe_indiv_phone'] = fi.phone as string
    } else if (seg === 'ENTITY_FI' || seg === 'FI') {
      if (fi.companyName) entityInit['qe_fi_legal_name'] = fi.companyName as string
      if (fi.foundingCountry) entityInit['qe_fi_incorp_country'] = fi.foundingCountry as string
    }

    const result: Record<string, unknown> = {}
    if (Object.keys(entityInit).length > 0) result.entity = entityInit

    const fiSvcSet = new Set(fiServiceCodes as string[])
    if (fiSvcSet.has('SVC_COL_VND') || fiSvcSet.has('SVC_VND') || fiServiceSegs.includes('VND Collection')) {
      const vndInit: Record<string, string> = {}
      if (fi.companyName) vndInit['qs_vnd_entity_name'] = fi.companyName as string
      if (fi.foundingCountry) vndInit['qs_vnd_incorp_country'] = fi.foundingCountry as string
      if (fi.contactName) vndInit['qs_vnd_contact_name'] = fi.contactName as string
      if (fi.phone) vndInit['qs_vnd_contact_phone'] = fi.phone as string
      if (fi.email) vndInit['qs_vnd_contact_email'] = fi.email as string
      if (fi.monthlyVolume) vndInit['qs_vnd_monthly_volume'] = fi.monthlyVolume as string
      if (Object.keys(vndInit).length > 0) result.vnd = vndInit
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
  const svcSet = new Set(serviceCodes as string[])
  const needsKRW = svcSet.has('SVC_COL_KRW') || svcSet.has('SVC_KRW') || serviceSegsLegacy.includes('KRW Collection')
  const needsVND = svcSet.has('SVC_COL_VND') || svcSet.has('SVC_VND') || serviceSegsLegacy.includes('VND Collection')

  const entityCode = entitySegment as EntityCode | undefined

  if (!entityCode) {
    navigate('/customer/onboarding', { replace: true })
    return null
  }

  const entityCommonQs = getSegmentQuestions(`entity:${entityCode}`)
  const entityFixedQs  = getEntityFixedQuestions(entityCode)
  const krwQuestions   = needsKRW ? getSegmentQuestions('service:SVC_COL_KRW') : []
  const entityQuestions = [...entityCommonQs, ...entityFixedQs, ...krwQuestions]

  const vndQuestions = needsVND ? getSegmentQuestions('service:SVC_COL_VND') : []

  function saveDraft(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { secondIntake: { status: 'draft', data, savedAt: Date.now() } })
  }

  function saveAndNavigate(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { secondIntake: { status: 'draft', data, savedAt: Date.now() } })
    navigate(`/customer/case/${id}/review/second`)
  }

  function afterEntity(entityData: Record<string, unknown>, allData: Record<string, unknown>) {
    let next = allData
    if (needsKRW) {
      const krwIds = new Set(krwQuestions.map(q => q.id))
      const krwData: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(entityData)) {
        if (krwIds.has(k)) krwData[k] = v
      }
      const sector = krwData['qs_krw_sector'] as string | undefined
      next = { ...allData, krwCollection: { sector, ...krwData } }
      setAccumulated(next)
    }
    if (needsVND) { setStage('vnd_questions'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  const entityTitle: Record<string, string> = {
    ENTITY_CORP: '법인 정보 입력',
    'SentBiz Corporate': '법인 정보 입력',
    ENTITY_INDIV: '개인사업자 정보 입력',
    'SentBiz Individual': '개인사업자 정보 입력',
    ENTITY_FI: '금융기관 정보 입력',
    FI: '금융기관 정보 입력',
  }

  if (stage === 'entity_questions') {
    const entityInitial = {
      ...((accumulated.entity as Record<string, unknown>) ?? {}),
      ...((accumulated.krwCollection as Record<string, unknown>) ?? {}),
    }
    return (
      <DynamicQuestionsSection
        title={entityTitle[entitySegment ?? ''] ?? '정보 입력'}
        questions={entityQuestions}
        initialData={entityInitial}
        onComplete={(d) => {
          const next = { ...accumulated, entity: d }
          afterEntity(d, next)
        }}
        onBack={() => navigate(-1)}
        onDraftSave={(d) => saveDraft({ ...accumulated, entity: d })}
      />
    )
  }

  if (stage === 'vnd_questions')
    return (
      <DynamicQuestionsSection
        title="VND Collection 정보"
        questions={vndQuestions}
        initialData={(accumulated.vnd as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, vnd: d }
          setAccumulated(next)
          saveAndNavigate(next)
        }}
        onBack={() => { setStage('entity_questions'); window.scrollTo({ top: 0 }) }}
        onDraftSave={(d) => saveDraft({ ...accumulated, vnd: d })}
      />
    )

  return null
}
