import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import { getRuleSet } from '../../../store/ruleStore'
import type { ServiceCode, EntityCode, QuestionRule } from '../../../types'
import DynamicQuestionsSection from './DynamicQuestionsSection'

type Stage =
  | 'corp_s1' | 'corp_s2'
  | 'indiv_s1' | 'indiv_s2'
  | 'fi_s1' | 'fi_s2' | 'fi_s3' | 'fi_s4'
  | 'vnd_questions'

// Question IDs per screen — order determines display order
const CORP_S1_IDS = [
  'qc_biz_reg_no', 'qc_biz_type', 'qc_biz_category',
  'qe_corp_name_kr', 'qe_corp_name_en', 'qe_corp_phone', 'qe_corp_address',
  'qe_corp_type', 'qe_corp_reg_no', 'qe_corp_nation', 'qe_corp_hq_addr',
  'qe_corp_rep_type', 'qe_corp_rep_group',
  'qc_company_size', 'qc_listed', 'qc_founded_date',
]
const CORP_S2_IDS = [
  'qe_corp_bo_exempt', 'qe_corp_bo_has_25', 'qe_corp_bo_no25_holder', 'qe_corp_bo_no25_is_rep', 'qe_corp_bo_group',
  'qc_trade_purpose', 'qc_virtual_asset', 'qc_fund_source',
  'qc_tax_type', 'qc_website', 'qc_rep_phone', 'qc_main_goods',
  'qs_krw_a_email', 'qs_krw_a_prev_fi', 'qs_krw_a_sub_merchants',
  'qs_krw_b_main_activity', 'qs_krw_b_biz_desc', 'qs_krw_b_fund_source',
  'qs_krw_c_purpose', 'qs_krw_c_va_count', 'qs_krw_c_static_reason', 'qs_krw_c_monthly_vol', 'qs_krw_c_depositor_rel', 'qs_krw_c_depositor_type',
  'qs_krw_d_contact_name', 'qs_krw_d_contact_title', 'qs_krw_d_contact_phone',
]

const INDIV_S1_IDS = [
  'qc_biz_reg_no', 'qc_biz_type', 'qc_biz_category',
  'qe_indiv_biz_name', 'qe_indiv_biz_name_en', 'qe_indiv_phone', 'qe_indiv_address', 'qe_indiv_residence',
  'qe_indiv_rep_name_kr', 'qe_indiv_rep_name_en', 'qe_indiv_rep_dob', 'qe_indiv_rep_gender', 'qe_indiv_rep_nation',
  'qc_company_size', 'qc_listed', 'qc_founded_date',
]
const INDIV_S2_IDS = [
  'qe_indiv_bo_same',
  'qc_trade_purpose', 'qc_virtual_asset', 'qc_fund_source',
  'qc_tax_type', 'qc_website', 'qc_rep_phone', 'qc_main_goods',
  'qs_krw_a_email', 'qs_krw_a_prev_fi', 'qs_krw_a_sub_merchants',
  'qs_krw_b_main_activity', 'qs_krw_b_biz_desc', 'qs_krw_b_fund_source',
  'qs_krw_c_purpose', 'qs_krw_c_va_count', 'qs_krw_c_static_reason', 'qs_krw_c_monthly_vol', 'qs_krw_c_depositor_rel', 'qs_krw_c_depositor_type',
  'qs_krw_d_contact_name', 'qs_krw_d_contact_title', 'qs_krw_d_contact_phone',
]

const FI_S1_IDS = [
  'qc_virtual_asset',
  'qe_fi_legal_name', 'qe_fi_legal_name_en', 'qe_fi_legal_form', 'qe_fi_founded_date', 'qe_fi_incorp_country',
  'qe_fi_phone', 'qe_fi_biz_reg_no', 'qe_fi_reg_address',
  'qe_fi_rep_name', 'qe_fi_rep_dob', 'qe_fi_rep_gender', 'qe_fi_rep_nation',
]
const FI_S2_BASE_IDS: string[] = []
const FI_S2_PAYOUT_IDS: string[] = []
const FI_S3_IDS = ['qe_fi_ubo_group', 'qc_fund_source']
const FI_S4_IDS = [
  'qe_fi_aml_sanction', 'qc_trade_purpose', 'qc_tax_type', 'qc_website', 'qc_rep_phone', 'qc_main_goods',
  'qs_krw_a_email', 'qs_krw_a_prev_fi', 'qs_krw_a_sub_merchants',
  'qs_krw_b_main_activity', 'qs_krw_b_biz_desc', 'qs_krw_b_fund_source',
  'qs_krw_c_purpose', 'qs_krw_c_va_count', 'qs_krw_c_static_reason', 'qs_krw_c_monthly_vol', 'qs_krw_c_depositor_rel', 'qs_krw_c_depositor_type',
  'qs_krw_d_contact_name', 'qs_krw_d_contact_title', 'qs_krw_d_contact_phone',
]

// Corporate fund source: exclude 근로·연금소득, 상속·증여, 일시 재산양도
const CORP_FUND_SOURCE_ALLOWED = [
  'business_income', 'real_estate_rent', 'real_estate_sale', 'financial_income', 'other',
]

function buildAllQuestions(entityCode: EntityCode, serviceCodes: ServiceCode[]): QuestionRule[] {
  const rs = getRuleSet()
  const common = rs.questionPool.filter(q => q.classification === 'common')
  const entityOwn = rs.questionPool.filter(
    q => q.classification === 'entity-own' && (q.scope === entityCode || q.scopeEntity === entityCode)
  )
  const serviceQs: QuestionRule[] = []
  for (const svc of serviceCodes) {
    const cfg = rs.segmentQuestionConfigs.find(c => c.key === `service:${svc}`)
    if (cfg) serviceQs.push(...cfg.ownQuestions)
  }
  const seen = new Set<string>()
  const all: QuestionRule[] = []
  for (const q of [...common, ...entityOwn, ...serviceQs]) {
    if (!seen.has(q.id)) { seen.add(q.id); all.push(q) }
  }
  return all
}

function pickByIds(questions: QuestionRule[], ids: string[]): QuestionRule[] {
  const map = new Map(questions.map(q => [q.id, q]))
  return ids.flatMap(id => { const q = map.get(id); return q ? [q] : [] })
}

function applyOptionFilter(questions: QuestionRule[], targetId: string, allowedValues: string[]): QuestionRule[] {
  return questions.map(q =>
    q.id === targetId && q.options
      ? { ...q, options: q.options.filter(opt => allowedValues.includes(opt.value)) }
      : q
  )
}

export default function InformationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  const raw = (c?.segmentInfo as unknown as Record<string, unknown>) ?? {}
  const entitySegmentRaw = (raw.entity ?? raw.entitySegment ?? raw.customerType) as string | undefined
  const entityCode = entitySegmentRaw as EntityCode | undefined
  const serviceCodes = Array.isArray(raw.services) ? (raw.services as ServiceCode[]) : []
  const svcSet = new Set(serviceCodes as string[])
  const needsVND = svcSet.has('SVC_COL_VND') || (Array.isArray(raw.serviceSegments) && (raw.serviceSegments as string[]).includes('VND Collection'))
  const hasPayout = svcSet.has('SVC_PAYOUT')
  const isKR = raw.foundingCountry === 'KR'

  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(() => {
    if (c?.secondIntake?.status === 'draft') {
      return c.secondIntake.data as Record<string, unknown>
    }
    return {}
  })

  const [stage, setStage] = useState<Stage>(() => {
    const draftStage = (c?.secondIntake?.data as Record<string, unknown>)?._stage as Stage | undefined
    if (draftStage) return draftStage
    if (entityCode === 'ENTITY_CORP') return 'corp_s1'
    if (entityCode === 'ENTITY_INDIV') return 'indiv_s1'
    return 'fi_s1'
  })

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (!entityCode) {
    navigate('/customer/onboarding', { replace: true })
    return null
  }

  const allQuestions = buildAllQuestions(entityCode, serviceCodes)

  function saveDraft(stageKey: string, data: Record<string, unknown>) {
    if (!id) return
    const next = { ...accumulated, [stageKey]: data, _stage: stage }
    updateCase(id, { secondIntake: { status: 'draft', data: next, savedAt: Date.now() } })
  }

  function mergeEntityScreens(next: Record<string, unknown>): Record<string, unknown> {
    const entityData = {
      ...(next.corp_s1 as Record<string, unknown> ?? {}),
      ...(next.corp_s2 as Record<string, unknown> ?? {}),
      ...(next.indiv_s1 as Record<string, unknown> ?? {}),
      ...(next.indiv_s2 as Record<string, unknown> ?? {}),
      ...(next.fi_s1 as Record<string, unknown> ?? {}),
      ...(next.fi_s2 as Record<string, unknown> ?? {}),
      ...(next.fi_s3 as Record<string, unknown> ?? {}),
      ...(next.fi_s4 as Record<string, unknown> ?? {}),
    }
    return { ...next, entity: entityData }
  }

  function isLastEntityStage(stageKey: string): boolean {
    return (
      (entityCode === 'ENTITY_CORP' && stageKey === 'corp_s2') ||
      (entityCode === 'ENTITY_INDIV' && stageKey === 'indiv_s2') ||
      (entityCode === 'ENTITY_FI' && stageKey === 'fi_s4')
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
      navigate(`/customer/case/${id}/review/second`)
    }
  }

  function goBack(prevStage: Stage | null) {
    if (prevStage) { setStage(prevStage); window.scrollTo({ top: 0 }) }
    else navigate(-1)
  }

  function lastEntityStage(): Stage {
    if (entityCode === 'ENTITY_CORP') return 'corp_s2'
    if (entityCode === 'ENTITY_INDIV') return 'indiv_s2'
    return 'fi_s4'
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

  // ── 비영리법인 차단 ───────────────────────────────────────────────────────
  const isNonprofit = (accumulated.corp_s1 as Record<string, unknown> | undefined)?.qe_corp_type === 'nonprofit'
  if (stage === 'corp_s2' && isNonprofit) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-sb-n200 p-8 max-w-lg w-full text-center">
          <p className="text-sb-n700 font-medium mb-4">
            비영리법인(단체)은 현재 온보딩 신청을 받고 있지 않습니다. 자세한 문의는 고객센터로 연락해주세요.
          </p>
          <button
            onClick={() => goBack('corp_s1')}
            className="mt-2 px-5 py-2 rounded-lg border border-sb-n300 text-sb-n600 text-sm hover:bg-sb-n50 transition-colors"
          >
            이전으로
          </button>
        </div>
      </div>
    )
  }

  // ── CORP Screen 2 ─────────────────────────────────────────────────────────
  if (stage === 'corp_s2') {
    let qs = pickByIds(allQuestions, CORP_S2_IDS)
    const entityCfg = getRuleSet().segmentQuestionConfigs.find(c => c.key === `entity:${entityCode}`)
    const filters = entityCfg?.commonOptionFilters ?? {}
    for (const [qId, allowed] of Object.entries(filters)) qs = applyOptionFilter(qs, qId, allowed)
    if (!filters['qc_fund_source']) qs = applyOptionFilter(qs, 'qc_fund_source', CORP_FUND_SOURCE_ALLOWED)
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
        screenInfo={{ current: 1, total: 4, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s1', d, 'fi_s2')}
        onBack={() => goBack(null)}
        onDraftSave={(d) => saveDraft('fi_s1', d)}
      />
    )
  }

  // ── FI Screen 2 (인허가 + 서비스) ─────────────────────────────────────────
  if (stage === 'fi_s2') {
    const ids = [...FI_S2_BASE_IDS, ...(hasPayout ? FI_S2_PAYOUT_IDS : [])]
    return (
      <DynamicQuestionsSection
        title="인허가 / 서비스 정보"
        questions={pickByIds(allQuestions, ids)}
        initialData={(accumulated.fi_s2 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 2, total: 4, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s2', d, 'fi_s3')}
        onBack={() => goBack('fi_s1')}
        onDraftSave={(d) => saveDraft('fi_s2', d)}
      />
    )
  }

  // ── FI Screen 3 (소유 구조) ────────────────────────────────────────────────
  if (stage === 'fi_s3') {
    return (
      <DynamicQuestionsSection
        title="소유 구조 / 자금 원천"
        questions={pickByIds(allQuestions, FI_S3_IDS)}
        initialData={(accumulated.fi_s3 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 3, total: 4, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s3', d, 'fi_s4')}
        onBack={() => goBack('fi_s2')}
        onDraftSave={(d) => saveDraft('fi_s3', d)}
      />
    )
  }

  // ── FI Screen 4 (법적/AML) ────────────────────────────────────────────────
  if (stage === 'fi_s4') {
    return (
      <DynamicQuestionsSection
        title="법적 / AML 정보"
        questions={pickByIds(allQuestions, FI_S4_IDS)}
        initialData={(accumulated.fi_s4 as Record<string, unknown>) ?? {}}
        isKR={isKR}
        screenInfo={{ current: 4, total: 4, label: '금융기관 정보 입력' }}
        onComplete={(d) => advance('fi_s4', d, needsVND ? 'vnd_questions' : null)}
        onBack={() => goBack('fi_s3')}
        onDraftSave={(d) => saveDraft('fi_s4', d)}
      />
    )
  }

  // ── VND Collection ─────────────────────────────────────────────────────────
  if (stage === 'vnd_questions') {
    const vndCfg = getRuleSet().segmentQuestionConfigs.find(c => c.key === 'service:SVC_COL_VND')
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
          navigate(`/customer/case/${id}/review/second`)
        }}
        onBack={() => goBack(lastEntityStage())}
        onDraftSave={(d) => saveDraft('vnd', d)}
      />
    )
  }

  return null
}
