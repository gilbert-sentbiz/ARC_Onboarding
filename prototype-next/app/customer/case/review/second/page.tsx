'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useCaseStore } from '@/store/caseStore'
import { useSessionStore } from '@/store/sessionStore'
import { useIntakeResponseStore } from '@/store/intakeResponseStore'
import { confirmSecondIntake } from '@/services/caseService'
import { submitSecondIntake } from '@/services/api/cases'
import { getRuleSet } from '@/store/ruleStore'
import type { QuestionRule } from '@/types'
import Button from '@/components/ui/Button'
import { getCountryName } from '@/utils/countryNames'

function buildLabelMap(): Record<string, string> {
  const rs = getRuleSet()
  const map: Record<string, string> = {}
  function walk(qs: QuestionRule[]) {
    for (const q of qs) {
      map[q.id] = q.label
      if (q.children?.length) walk(q.children)
    }
  }
  walk(rs.questionPool)
  for (const config of rs.segmentQuestionConfigs) {
    walk(config.ownQuestions)
  }
  return map
}

// PI-237: 질문 id → { 옵션 value → 옵션 label } 맵. 라디오/셀렉트 답변값(예 'no')을
// 한글 라벨(예 '아니오')로 치환하기 위함.
function buildOptionMap(): Record<string, Record<string, string>> {
  const rs = getRuleSet()
  const map: Record<string, Record<string, string>> = {}
  function walk(qs: QuestionRule[]) {
    for (const q of qs) {
      if (q.options?.length) {
        map[q.id] = Object.fromEntries(q.options.map((o) => [o.value, o.label]))
      }
      if (q.children?.length) walk(q.children)
    }
  }
  walk(rs.questionPool)
  for (const config of rs.segmentQuestionConfigs) {
    walk(config.ownQuestions)
  }
  return map
}

const SERVICE_LABELS: Record<string, string> = {
  remittance: '해외 송금',
  collection: '수금',
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  corporation: '법인 사업자',
  individual: '개인 사업자',
  financial: '금융기관(PG사·PSP·MSB 등)',
}

function getLabel(key: string, labelMap: Record<string, string>): string {
  if (labelMap[key]) return labelMap[key]
  const base = key.replace(/_\d+$/, '')
  if (base !== key && labelMap[base]) return labelMap[base]
  return key
}

// PI-237: opts(옵션 value→label 맵)가 있으면 답변값을 옵션 라벨로 치환.
function renderValue(val: unknown, opts?: Record<string, string>): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? '예' : '아니오'
  if (Array.isArray(val)) {
    if (!val.length) return '—'
    return val.map((v) => opts?.[String(v)] ?? String(v)).join(', ')
  }
  const s = String(val)
  return opts?.[s] ?? s
}

type FieldProps = { label: string; value: string }

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: 'var(--sb-n400)' }}>{label}</p>
      <p className="text-[14px] break-words" style={{ color: 'var(--sb-n800)' }}>{value || '—'}</p>
    </div>
  )
}

type SectionLabelProps = { children: React.ReactNode }

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-[12px] font-semibold tracking-[1px] uppercase" style={{ color: 'var(--sb-brand)' }}>
      {children}
    </p>
  )
}

type DataBlockProps = {
  data: Record<string, unknown>
  labelMap: Record<string, string>
  optionMap: Record<string, Record<string, string>>
}

function DataBlock({ data, labelMap, optionMap }: DataBlockProps) {
  const entries = Object.entries(data).filter(([key, v]) => {
    if (v === null || v === undefined || v === '' || v === false) return false
    if (Array.isArray(v) && v.length === 0) return false
    if (getLabel(key, labelMap) === key) return false
    return true
  })
  if (entries.length === 0) return <p className="text-[13px]" style={{ color: 'var(--sb-n400)' }}>입력된 정보가 없습니다.</p>
  return (
    <div className="grid grid-cols-2 gap-4">
      {entries.map(([key, val]) => {
        // PI-237: 질문 id(반복 접미사 _N 제거)로 옵션 라벨 맵 조회 → 답변값 치환
        const opts = optionMap[key] ?? optionMap[key.replace(/_\d+$/, '')]
        return <Field key={key} label={getLabel(key, labelMap)} value={renderValue(val, opts)} />
      })}
    </div>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const firstIntake = useIntakeResponseStore((s) => id ? s.getByCase(id, 'first') : null)
  const secondIntake = useIntakeResponseStore((s) => id ? s.getByCase(id, 'second') : null)

  if (!c || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-n50)' }}>
        <p style={{ color: 'var(--sb-n500)' }}>케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const d1 = (firstIntake?.answers ?? {}) as Record<string, unknown>
  const str1 = (key: string) => String(d1[key] ?? '')
  const services = (d1.services as string[]) ?? []
  const collectionCountries = (d1.collectionCountries as string[]) ?? []

  const labelMap = buildLabelMap()
  const optionMap = buildOptionMap()

  const d2 = (secondIntake?.answers ?? {}) as {
    entity?: Record<string, unknown>
    krwCollection?: Record<string, unknown>
    vndCollection?: Record<string, unknown>
  }

  async function handleConfirm() {
    if (!id) return
    const result = confirmSecondIntake(id, session?.name || session?.email || '고객')
    if (!result.ok) return
    // PI-226 ③: 백엔드 2차 제출(C6) — 실 caseId(backendId)+토큰 있을 때. 실패 시 로컬 진행.
    const caseObj = useCaseStore.getState().cases[id]
    const token = useSessionStore.getState().token
    if (token && caseObj?.backendId) {
      const answers = (useIntakeResponseStore.getState().getByCase(id, 'second')?.answers ?? {}) as Record<string, unknown>
      try {
        await submitSecondIntake(caseObj.backendId, { answers }, token)
      } catch {
        /* 백엔드 미연결 — 로컬 진행 */
      }
    }
    router.push(`/customer/case/documents?id=${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: 'var(--sb-n50)' }}>
      {/* Header */}
      <div className="w-full max-w-[640px] mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => router.push(`/customer/case/information?id=${id}`)}
            className="flex items-center gap-1.5 text-[13px] transition-colors"
            style={{ color: 'var(--sb-n500)' }}
          >
            <ArrowLeft size={16} />
            수정하기
          </button>
          <span className="text-[13px] font-medium" style={{ color: 'var(--sb-n500)' }}>2차 정보 확인</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: 'var(--sb-brand)' }} />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[640px] bg-white rounded-[16px] p-8 flex flex-col gap-6"
        style={{ boxShadow: 'var(--shadow-200)' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] leading-[30px] font-bold" style={{ color: 'var(--sb-n900)' }}>전체 입력 내용을 확인해주세요</h2>
          <p className="text-[14px] leading-[20px]" style={{ color: 'var(--sb-n500)' }}>
            제출 후에는 수정이 어렵습니다. 내용을 꼼꼼히 확인해주세요.
          </p>
        </div>

        {/* ── 1차 정보 ── */}
        <div className="flex flex-col gap-3 p-4 rounded-[12px] border" style={{ background: 'var(--sb-n50)', borderColor: 'var(--sb-n200)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--sb-n700)' }}>1차 정보</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <SectionLabel>담당자 정보</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <Field label="회사명" value={str1('companyName')} />
                <Field label="담당자 이름" value={str1('contactName')} />
                <Field label="직함" value={str1('contactTitle')} />
                <Field label="연락처" value={str1('phone')} />
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--sb-n200)' }} />

            <div className="flex flex-col gap-3">
              <SectionLabel>서비스</SectionLabel>
              <Field label="신청 서비스" value={services.map((s) => SERVICE_LABELS[s] ?? s).join(', ')} />
              {services.includes('collection') && (
                <Field
                  label="수금 국가"
                  value={collectionCountries
                    .map((cc) => (cc === 'OTHER' ? str1('collectionOtherCountry') || '기타' : getCountryName(cc)))
                    .join(', ')}
                />
              )}
              {services.includes('remittance') && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="송금 출발 국가" value={getCountryName(str1('remittanceFrom'))} />
                  <Field label="송금 도착 국가" value={str1('remittanceTo').split(', ').map(getCountryName).join(', ')} />
                </div>
              )}
            </div>

            <div className="h-px" style={{ background: 'var(--sb-n200)' }} />

            <div className="flex flex-col gap-3">
              <SectionLabel>사업자 정보</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="사업자 유형"
                  value={BUSINESS_TYPE_LABELS[str1('businessType')] ?? str1('businessType')}
                />
                <Field label="설립 국가" value={getCountryName(str1('foundingCountry'))} />
                <Field
                  label="예상 월간 거래 규모"
                  value={
                    str1('monthlyVolume')
                      ? `${str1('monthlyVolume')} ${str1('monthlyVolumeCurrency') === 'OTHER' ? str1('monthlyVolumeCurrencyOther') : str1('monthlyVolumeCurrency')}`
                      : '—'
                  }
                />
              </div>
            </div>

            {str1('additionalNote') && (
              <>
                <div className="h-px" style={{ background: 'var(--sb-n200)' }} />
                <Field label="추가 문의사항" value={str1('additionalNote')} />
              </>
            )}
          </div>
        </div>

        {/* ── 2차 정보 ── */}
        <div className="flex flex-col gap-3 p-4 rounded-[12px] border" style={{ background: 'var(--sb-n50)', borderColor: 'var(--sb-n200)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--sb-n700)' }}>2차 정보</p>

          {d2.entity && (
            <div className="flex flex-col gap-3">
              <SectionLabel>기업 정보</SectionLabel>
              <DataBlock data={d2.entity} labelMap={labelMap} optionMap={optionMap} />
            </div>
          )}

          {d2.krwCollection && (
            <>
              <div className="h-px" style={{ background: 'var(--sb-n200)' }} />
              <div className="flex flex-col gap-3">
                <SectionLabel>KRW 수금 정보</SectionLabel>
                <DataBlock data={d2.krwCollection} labelMap={labelMap} optionMap={optionMap} />
              </div>
            </>
          )}

          {d2.vndCollection && (
            <>
              <div className="h-px" style={{ background: 'var(--sb-n200)' }} />
              <div className="flex flex-col gap-3">
                <SectionLabel>VND 수금 정보</SectionLabel>
                <DataBlock data={d2.vndCollection} labelMap={labelMap} optionMap={optionMap} />
              </div>
            </>
          )}

          {!d2.entity && !d2.krwCollection && !d2.vndCollection && (
            <p className="text-[13px]" style={{ color: 'var(--sb-n400)' }}>입력된 2차 정보가 없습니다.</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/customer/case/information?id=${id}`)}
            className="flex-1"
          >
            <ArrowLeft size={16} />
            수정하기
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            제출하기
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={null}><PageContent /></Suspense>
}
