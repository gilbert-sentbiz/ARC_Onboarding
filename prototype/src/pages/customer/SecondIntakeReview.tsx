import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import { useSessionStore } from '../../store/sessionStore'
import { confirmSecondIntake } from '../../services/caseService'
import Button from '../../components/ui/Button'

const SERVICE_LABELS: Record<string, string> = {
  remittance: '해외 송금',
  collection: '수금',
}

const COLLECTION_LABELS: Record<string, string> = {
  KRW: '한국 (KRW)',
  VND: '베트남 (VND)',
  OTHER: '기타',
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  corporation: '법인 사업자',
  individual: '개인 사업자',
  financial: '금융업',
}

function prettifyKey(key: string): string {
  const LABELS: Record<string, string> = {
    companyName: '회사명', contactName: '담당자', contactTitle: '직함',
    phone: '연락처', email: '이메일', foundingCountry: '설립 국가',
    businessType: '사업자 유형', monthlyVolume: '월 거래 규모',
    monthlyVolumeCurrency: '통화', monthlyCount: '월 거래 건수',
    referralSource: '유입 경로', additionalNote: '추가 문의',
    businessRegistrationNumber: '사업자등록번호', ceo: '대표자',
    address: '사업장 주소', businessSector: '업종', mainProduct: '주요 제품/서비스',
    averageTransactionAmount: '평균 거래 금액', transactionPurpose: '거래 목적',
    counterpartyCountry: '거래 상대국', counterpartyBank: '상대방 은행',
    settlementCurrency: '결제 통화',
  }
  if (LABELS[key]) return LABELS[key]
  return key.replace(/([A-Z])/g, ' $1').trim()
}

function renderValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? '예' : '아니오'
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—'
  return String(val)
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-sb-n400 uppercase tracking-[0.5px]">{label}</p>
      <p className="text-[14px] text-sb-n800 break-words">{value || '—'}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">
      {children}
    </p>
  )
}

function DataBlock({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => {
    if (v === null || v === undefined || v === '' || v === false) return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
  if (entries.length === 0) return <p className="text-[13px] text-sb-n400">입력된 정보가 없습니다.</p>
  return (
    <div className="grid grid-cols-2 gap-4">
      {entries.map(([key, val]) => (
        <Field key={key} label={prettifyKey(key)} value={renderValue(val)} />
      ))}
    </div>
  )
}

export default function SecondIntakeReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  if (!c || !id) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const d1 = c.firstIntake.data as Record<string, unknown>
  const str1 = (key: string) => String(d1[key] ?? '')
  const services = (d1.services as string[]) ?? []
  const collectionCountries = (d1.collectionCountries as string[]) ?? []

  const d2 = c.secondIntake.data as {
    entity?: Record<string, unknown>
    krwCollection?: Record<string, unknown>
    vndCollection?: Record<string, unknown>
  }

  function handleConfirm() {
    if (!id) return
    const result = confirmSecondIntake(id, session?.name || session?.email || '고객')
    if (result.ok) {
      navigate(`/customer/case/${id}/documents`)
    }
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-[640px] mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate(`/customer/case/${id}/information`)}
            className="flex items-center gap-1.5 text-[13px] text-sb-n500 hover:text-sb-n800 transition-colors"
          >
            <ArrowLeft size={16} />
            수정하기
          </button>
          <span className="text-[13px] font-medium text-sb-n500">2차 정보 확인</span>
        </div>
        <div className="w-full h-1 bg-sb-brand rounded-full" />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[640px] bg-white rounded-[16px] p-8 flex flex-col gap-6"
        style={{ boxShadow: 'var(--shadow-200)' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] leading-[30px] font-bold text-sb-n900">전체 입력 내용을 확인해주세요</h2>
          <p className="text-[14px] leading-[20px] text-sb-n500">
            제출 후에는 수정이 어렵습니다. 내용을 꼼꼼히 확인해주세요.
          </p>
        </div>

        {/* ── 1차 정보 ── */}
        <div className="flex flex-col gap-3 p-4 bg-sb-n50 rounded-[12px] border border-sb-n200">
          <p className="text-[13px] font-semibold text-sb-n700">1차 정보</p>

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

            <div className="h-px bg-sb-n200" />

            <div className="flex flex-col gap-3">
              <SectionLabel>서비스</SectionLabel>
              <Field label="신청 서비스" value={services.map((s) => SERVICE_LABELS[s] ?? s).join(', ')} />
              {services.includes('collection') && (
                <Field
                  label="수금 국가"
                  value={collectionCountries
                    .map((cc) => (cc === 'OTHER' ? str1('collectionOtherCountry') || '기타' : COLLECTION_LABELS[cc] ?? cc))
                    .join(', ')}
                />
              )}
              {services.includes('remittance') && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="송금 출발 국가" value={str1('remittanceFrom')} />
                  <Field label="송금 도착 국가" value={str1('remittanceTo')} />
                </div>
              )}
            </div>

            <div className="h-px bg-sb-n200" />

            <div className="flex flex-col gap-3">
              <SectionLabel>사업자 정보</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="사업자 유형"
                  value={BUSINESS_TYPE_LABELS[str1('businessType')] ?? str1('businessType')}
                />
                <Field label="설립 국가" value={str1('foundingCountry')} />
                <Field
                  label="예상 월간 거래 규모"
                  value={
                    str1('monthlyVolume')
                      ? `${str1('monthlyVolume')} ${str1('monthlyVolumeCurrency') === 'OTHER' ? str1('monthlyVolumeCurrencyOther') : str1('monthlyVolumeCurrency')}`
                      : '—'
                  }
                />
                <Field
                  label="예상 월간 거래 건수"
                  value={str1('monthlyCount') ? `${str1('monthlyCount')}건` : '—'}
                />
              </div>
            </div>

            {str1('additionalNote') && (
              <>
                <div className="h-px bg-sb-n200" />
                <Field label="추가 문의사항" value={str1('additionalNote')} />
              </>
            )}
          </div>
        </div>

        {/* ── 2차 정보 ── */}
        <div className="flex flex-col gap-3 p-4 bg-sb-n50 rounded-[12px] border border-sb-n200">
          <p className="text-[13px] font-semibold text-sb-n700">2차 정보</p>

          {d2.entity && (
            <div className="flex flex-col gap-3">
              <SectionLabel>기업 정보</SectionLabel>
              <DataBlock data={d2.entity} />
            </div>
          )}

          {d2.krwCollection && (
            <>
              <div className="h-px bg-sb-n200" />
              <div className="flex flex-col gap-3">
                <SectionLabel>KRW 수금 정보</SectionLabel>
                <DataBlock data={d2.krwCollection} />
              </div>
            </>
          )}

          {d2.vndCollection && (
            <>
              <div className="h-px bg-sb-n200" />
              <div className="flex flex-col gap-3">
                <SectionLabel>VND 수금 정보</SectionLabel>
                <DataBlock data={d2.vndCollection} />
              </div>
            </>
          )}

          {!d2.entity && !d2.krwCollection && !d2.vndCollection && (
            <p className="text-[13px] text-sb-n400">입력된 2차 정보가 없습니다.</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/customer/case/${id}/information`)}
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
