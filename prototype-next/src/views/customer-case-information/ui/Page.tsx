'use client'
import styled from '@emotion/styled'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { getRuleSet } from '@/src/entities/rule/model/ruleStore'
import type { ServiceCode, EntityCode, QuestionRule } from '@/src/shared/type'

import DynamicQuestionsSection from './DynamicQuestionsSection'

type Stage = 'corp_s1' | 'corp_s2' | 'indiv_s1' | 'indiv_s2' | 'fi_s1' | 'fi_s2' | 'vnd_questions'

// Question IDs per screen — order determines display order
const CORP_S1_IDS = [
  'qc_biz_reg_no',
  'qc_biz_type',
  'qc_biz_category',
  'qe_corp_name_kr',
  'qe_corp_name_en',
  'qe_corp_phone',
  'qe_corp_address',
  'qe_corp_type',
  'qe_corp_reg_no',
  'qe_corp_nation',
  'qe_corp_hq_addr',
  'qe_corp_rep_type',
  'qe_corp_rep_group',
  'qe_corp_size',
  'qe_corp_listed',
  'qe_corp_founded_date',
]
const CORP_S2_IDS = [
  'qe_corp_bo_exempt',
  'qe_corp_bo_has_25',
  'qe_corp_bo_count',
  'qe_corp_bo_group',
  'qe_corp_purpose',
  'qc_virtual_asset',
  'qc_fund_source',
  'qs_krw_sector',
]

const INDIV_S1_IDS = [
  'qc_biz_reg_no',
  'qc_biz_type',
  'qc_biz_category',
  'qe_indiv_biz_name',
  'qe_indiv_phone',
  'qe_indiv_address',
  'qe_indiv_residence',
  'qe_indiv_rep_name_kr',
  'qe_indiv_rep_name_en',
  'qe_indiv_rep_dob',
  'qe_indiv_rep_gender',
  'qe_indiv_rep_nation',
]
const INDIV_S2_IDS = [
  'qe_indiv_bo_same',
  'qe_indiv_purpose',
  'qc_virtual_asset',
  'qc_fund_source',
  'qs_krw_sector',
]

// PI-219: FI 2화면 축소 — 서비스 선택 제외
const FI_S1_IDS = [
  'qe_fi_legal_name',
  'qe_fi_legal_form',
  'qe_fi_founded_date',
  'qe_fi_incorp_country',
  'qe_fi_biz_reg_no',
  'qe_fi_website',
  'qe_fi_reg_address',
  'qe_fi_rep_name',
  'qe_fi_rep_dob',
]
const FI_S2_IDS = ['qe_fi_ubo_group', 'qe_fi_aml_sanction', 'qc_virtual_asset']

// Corporate fund source: exclude 근로·연금소득, 상속·증여, 일시 재산양도
const CORP_FUND_SOURCE_ALLOWED = [
  'business_income',
  'real_estate_rent',
  'real_estate_sale',
  'financial_income',
  'other',
]

function buildAllQuestions(entityCode: EntityCode, serviceCodes: ServiceCode[]): QuestionRule[] {
  const rs = getRuleSet()
  const common = rs.questionPool.filter((q) => q.classification === 'common')
  const entityOwn = rs.questionPool.filter(
    (q) =>
      q.classification === 'entity-own' && (q.scope === entityCode || q.scopeEntity === entityCode)
  )
  const serviceQs: QuestionRule[] = []
  for (const svc of serviceCodes) {
    const cfg = rs.segmentQuestionConfigs.find((c) => c.key === `service:${svc}`)
    if (cfg) serviceQs.push(...cfg.ownQuestions)
  }
  const seen = new Set<string>()
  const all: QuestionRule[] = []
  for (const q of [...common, ...entityOwn, ...serviceQs]) {
    if (!seen.has(q.id)) {
      seen.add(q.id)
      all.push(q)
    }
  }
  return all
}

function pickByIds(questions: QuestionRule[], ids: string[]): QuestionRule[] {
  const map = new Map(questions.map((q) => [q.id, q]))
  return ids.flatMap((id) => {
    const q = map.get(id)
    return q ? [q] : []
  })
}

function applyOptionFilter(
  questions: QuestionRule[],
  targetId: string,
  allowedValues: string[]
): QuestionRule[] {
  return questions.map((q) =>
    q.id === targetId && q.options
      ? { ...q, options: q.options.filter((opt) => allowedValues.includes(opt.value)) }
      : q
  )
}

const NotFoundScreen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sb-n50);
`

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  const raw = (c?.segmentInfo as unknown as Record<string, unknown>) ?? {}
  const entitySegmentRaw = (raw.entity ?? raw.entitySegment ?? raw.customerType) as
    string | undefined
  const entityCode = entitySegmentRaw as EntityCode | undefined
  const serviceCodes = Array.isArray(raw.services) ? (raw.services as ServiceCode[]) : []
  const svcSet = new Set(serviceCodes as string[])
  const needsVND =
    svcSet.has('SVC_COL_VND') ||
    (Array.isArray(raw.serviceSegments) &&
      (raw.serviceSegments as string[]).includes('VND Collection'))
  const isKR = raw.foundingCountry === 'KR'

  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(() => {
    if (c?.secondIntake?.status === 'draft') {
      return c.secondIntake.data as Record<string, unknown>
    }
    return {}
  })

  const [stage, setStage] = useState<Stage>(() => {
    const draftStage = (c?.secondIntake?.data as Record<string, unknown>)?._stage as
      Stage | undefined
    if (draftStage) return draftStage
    if (entityCode === 'ENTITY_CORP') return 'corp_s1'
    if (entityCode === 'ENTITY_INDIV') return 'indiv_s1'
    return 'fi_s1'
  })

  if (!c) {
    return (
      <NotFoundScreen>
        <p style={{ color: 'var(--sb-n500)' }}>케이스를 찾을 수 없습니다.</p>
      </NotFoundScreen>
    )
  }

  if (!entityCode) {
    router.replace('/customer/onboarding')
    return null
  }

  // PI-218: 해외 설립 FI → 준비 중 안내 후 종료
  if (entityCode === 'ENTITY_FI' && raw.foundingCountry !== 'KR') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--sb-n50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid var(--sb-n200)',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 600, color: 'var(--sb-n700)', marginBottom: '12px' }}>
            서비스 준비 중
          </p>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--sb-n500)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            해외 설립 기업(해외 법인·개인·해외 금융기관)의 온보딩은 현재 준비 중입니다.
            <br />
            서비스가 오픈되면 별도로 안내드리겠습니다.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid var(--sb-n300)',
              background: 'none',
              color: 'var(--sb-n600)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            이전으로
          </button>
        </div>
      </div>
    )
  }

  const allQuestions = buildAllQuestions(entityCode, serviceCodes)

  function saveDraft(stageKey: string, data: Record<string, unknown>) {
    if (!id) return
    const next = { ...accumulated, [stageKey]: data, _stage: stage }
    updateCase(id, { secondIntake: { status: 'draft', data: next, savedAt: Date.now() } })
  }

  function mergeEntityScreens(next: Record<string, unknown>): Record<string, unknown> {
    const entityData = {
      ...((next.corp_s1 as Record<string, unknown>) ?? {}),
      ...((next.corp_s2 as Record<string, unknown>) ?? {}),
      ...((next.indiv_s1 as Record<string, unknown>) ?? {}),
      ...((next.indiv_s2 as Record<string, unknown>) ?? {}),
      ...((next.fi_s1 as Record<string, unknown>) ?? {}),
      ...((next.fi_s2 as Record<string, unknown>) ?? {}),
    }
    return { ...next, entity: entityData }
  }

  function isLastEntityStage(stageKey: string): boolean {
    return (
      (entityCode === 'ENTITY_CORP' && stageKey === 'corp_s2') ||
      (entityCode === 'ENTITY_INDIV' && stageKey === 'indiv_s2') ||
      (entityCode === 'ENTITY_FI' && stageKey === 'fi_s2')
    )
  }

  function advance(stageKey: string, data: Record<string, unknown>, nextStage: Stage | null) {
    let next: Record<string, unknown> = { ...accumulated, [stageKey]: data }
    if (isLastEntityStage(stageKey)) next = mergeEntityScreens(next)
    setAccumulated(next)
    if (nextStage) {
      setStage(nextStage)
      window.scrollTo({ top: 0 })
    } else {
      if (!id) return
      updateCase(id, { secondIntake: { status: 'draft', data: next, savedAt: Date.now() } })
      router.push(`/customer/case/review/second?id=${id}`)
    }
  }

  function goBack(prevStage: Stage | null) {
    if (prevStage) {
      setStage(prevStage)
      window.scrollTo({ top: 0 })
    } else router.back()
  }

  function lastEntityStage(): Stage {
    if (entityCode === 'ENTITY_CORP') return 'corp_s2'
    if (entityCode === 'ENTITY_INDIV') return 'indiv_s2'
    return 'fi_s2'
  }

  // ── CORP Screen 1 ─────────────────────────────────────────────────────────
  if (stage === 'corp_s1') {
    return (
      <DynamicQuestionsSection
        title="기본 정보 / 대표자"
        questions={pickByIds(allQuestions, CORP_S1_IDS)}
        initialData={(accumulated.corp_s1 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 1, total: 2, label: '법인 정보 입력' }}
        onComplete={(d) => advance('corp_s1', d, 'corp_s2')}
        onBack={() => goBack(null)}
        onDraftSave={(d) => saveDraft('corp_s1', d)}
      />
    )
  }

  // ── CORP Screen 2 ─────────────────────────────────────────────────────────
  if (stage === 'corp_s2') {
    let qs = pickByIds(allQuestions, CORP_S2_IDS)
    const entityCfg = getRuleSet().segmentQuestionConfigs.find(
      (c) => c.key === `entity:${entityCode}`
    )
    const filters = entityCfg?.commonOptionFilters ?? {}
    for (const [qId, allowed] of Object.entries(filters)) qs = applyOptionFilter(qs, qId, allowed)
    if (!filters['qc_fund_source'])
      qs = applyOptionFilter(qs, 'qc_fund_source', CORP_FUND_SOURCE_ALLOWED)
    return (
      <DynamicQuestionsSection
        title="실제 소유자 / 추가 정보"
        questions={qs}
        initialData={(accumulated.corp_s2 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 2, total: 2, label: '법인 정보 입력' }}
        onComplete={(d) => advance('corp_s2', d, needsVND ? 'vnd_questions' : null)}
        onBack={() => goBack('corp_s1')}
        onDraftSave={(d) => saveDraft('corp_s2', d)}
      />
    )
  }

  // ── INDIV Screen 1 ────────────────────────────────────────────────────────
  if (stage === 'indiv_s1') {
    return (
      <DynamicQuestionsSection
        title="기본 정보 / 대표자"
        questions={pickByIds(allQuestions, INDIV_S1_IDS)}
        initialData={(accumulated.indiv_s1 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 1, total: 2, label: '개인사업자 정보 입력' }}
        onComplete={(d) => advance('indiv_s1', d, 'indiv_s2')}
        onBack={() => goBack(null)}
        onDraftSave={(d) => saveDraft('indiv_s1', d)}
      />
    )
  }

  // ── INDIV Screen 2 ────────────────────────────────────────────────────────
  if (stage === 'indiv_s2') {
    return (
      <DynamicQuestionsSection
        title="실제 소유자 / 추가 정보"
        questions={pickByIds(allQuestions, INDIV_S2_IDS)}
        initialData={(accumulated.indiv_s2 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 2, total: 2, label: '개인사업자 정보 입력' }}
        onComplete={(d) => advance('indiv_s2', d, needsVND ? 'vnd_questions' : null)}
        onBack={() => goBack('indiv_s1')}
        onDraftSave={(d) => saveDraft('indiv_s2', d)}
      />
    )
  }

  // ── FI Screen 1 ───────────────────────────────────────────────────────────
  if (stage === 'fi_s1') {
    return (
      <DynamicQuestionsSection
        title="기본 정보 / 대표자"
        questions={pickByIds(allQuestions, FI_S1_IDS)}
        initialData={(accumulated.fi_s1 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 1, total: 2, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s1', d, 'fi_s2')}
        onBack={() => goBack(null)}
        onDraftSave={(d) => saveDraft('fi_s1', d)}
      />
    )
  }

  // ── FI Screen 2 (소유 구조 / AML) ────────────────────────────────────────
  if (stage === 'fi_s2') {
    return (
      <DynamicQuestionsSection
        title="소유 구조 / AML"
        questions={pickByIds(allQuestions, FI_S2_IDS)}
        initialData={(accumulated.fi_s2 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 2, total: 2, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s2', d, needsVND ? 'vnd_questions' : null)}
        onBack={() => goBack('fi_s1')}
        onDraftSave={(d) => saveDraft('fi_s2', d)}
      />
    )
  }

  // ── VND Collection ─────────────────────────────────────────────────────────
  if (stage === 'vnd_questions') {
    const vndCfg = getRuleSet().segmentQuestionConfigs.find((c) => c.key === 'service:SVC_COL_VND')
    const vndQs = vndCfg?.ownQuestions ?? []
    return (
      <DynamicQuestionsSection
        title="VND Collection 정보"
        questions={vndQs}
        initialData={(accumulated.vnd as Record<string, unknown>) ?? {}}
        onComplete={(d) => {
          const next = { ...accumulated, vnd: d, vndCollection: d }
          setAccumulated(next)
          if (!id) return
          updateCase(id, { secondIntake: { status: 'draft', data: next, savedAt: Date.now() } })
          router.push(`/customer/case/review/second?id=${id}`)
        }}
        onBack={() => goBack(lastEntityStage())}
        onDraftSave={(d) => saveDraft('vnd', d)}
      />
    )
  }

  return null
}

export default function CustomerCaseInformationPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  )
}
