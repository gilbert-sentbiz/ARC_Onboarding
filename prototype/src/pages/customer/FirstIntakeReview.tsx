import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import Button from '../../components/ui/Button'
import { getCountryName } from '../../utils/countryNames'

const SERVICE_LABELS: Record<string, string> = {
  remittance: '해외 송금',
  collection: '수금',
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  corporation: '법인 사업자',
  individual: '개인 사업자',
  financial: '금융업',
}

const REFERRAL_LABELS: Record<string, string> = {
  search: '검색 (네이버·구글 등)',
  referral: '지인 추천',
  sns: 'SNS',
  news: '뉴스 기사',
  other: '기타',
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-sb-n400 uppercase tracking-[0.5px]">{label}</p>
      <p className="text-[14px] text-sb-n800">{value || '—'}</p>
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

export default function FirstIntakeReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)

  if (!c || !id) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const d = c.firstIntake.data as Record<string, unknown>
  const str = (key: string) => String(d[key] ?? '')
  const services = (d.services as string[]) ?? []
  const collectionCountries = (d.collectionCountries as string[]) ?? []

  function handleConfirm() {
    if (!id) return
    updateCase(id, {
      firstIntake: { status: 'submitted', data: c!.firstIntake.data, savedAt: Date.now() },
    })
    navigate(`/customer/case/${id}/information`)
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-[640px] mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate('/customer/onboarding')}
            className="flex items-center gap-1.5 text-[13px] text-sb-n500 hover:text-sb-n800 transition-colors"
          >
            <ArrowLeft size={16} />
            수정하기
          </button>
          <span className="text-[13px] font-medium text-sb-n500">1차 정보 확인</span>
        </div>
        <div className="w-full h-1 bg-sb-brand rounded-full" />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[640px] bg-white rounded-[16px] p-8 flex flex-col gap-6"
        style={{ boxShadow: 'var(--shadow-200)' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] leading-[30px] font-bold text-sb-n900">입력하신 내용을 확인해주세요</h2>
          <p className="text-[14px] leading-[20px] text-sb-n500">
            수정이 필요하시면 '수정하기'로 돌아가 변경할 수 있습니다.
          </p>
        </div>

        {/* 담당자 정보 */}
        <div className="flex flex-col gap-3">
          <SectionLabel>담당자 정보</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="회사명" value={str('companyName')} />
            <Field label="담당자 이름" value={str('contactName')} />
            <Field label="직함" value={str('contactTitle')} />
            <Field label="연락처" value={str('phone')} />
            <div className="col-span-2">
              <Field label="이메일" value={str('email')} />
            </div>
          </div>
        </div>

        <div className="h-px bg-sb-n100" />

        {/* 서비스 */}
        <div className="flex flex-col gap-3">
          <SectionLabel>서비스</SectionLabel>
          <Field
            label="신청 서비스"
            value={services.map((s) => SERVICE_LABELS[s] ?? s).join(', ')}
          />
          {services.includes('collection') && (
            <Field
              label="수금 국가"
              value={collectionCountries
                .map((cc) => {
                  if (cc === 'OTHER') return str('collectionOtherCountry') || '기타'
                  return getCountryName(cc)
                })
                .join(', ')}
            />
          )}
          {services.includes('remittance') && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="송금 출발 국가" value={getCountryName(str('remittanceFrom'))} />
              <Field
                label="송금 도착 국가"
                value={str('remittanceTo')
                  .split(', ')
                  .filter(Boolean)
                  .map(getCountryName)
                  .join(', ')}
              />
            </div>
          )}
        </div>

        <div className="h-px bg-sb-n100" />

        {/* 사업자 정보 */}
        <div className="flex flex-col gap-3">
          <SectionLabel>사업자 정보</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="사업자 유형"
              value={BUSINESS_TYPE_LABELS[str('businessType')] ?? str('businessType')}
            />
            <Field label="설립 국가" value={getCountryName(str('foundingCountry'))} />
          </div>
        </div>

        <div className="h-px bg-sb-n100" />

        {/* 거래 규모 */}
        <div className="flex flex-col gap-3">
          <SectionLabel>거래 규모</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="예상 월간 거래 규모"
              value={
                str('monthlyVolume')
                  ? `${str('monthlyVolume')} ${
                      str('monthlyVolumeCurrency') === 'OTHER'
                        ? str('monthlyVolumeCurrencyOther')
                        : str('monthlyVolumeCurrency')
                    }`
                  : '—'
              }
            />
            <Field
              label="예상 월간 거래 건수"
              value={str('monthlyCount') ? `${str('monthlyCount')}건` : '—'}
            />
          </div>
        </div>

        {/* 추가 정보 */}
        {(str('referralSource') || str('additionalNote')) && (
          <>
            <div className="h-px bg-sb-n100" />
            <div className="flex flex-col gap-3">
              <SectionLabel>추가 정보</SectionLabel>
              {str('referralSource') && (
                <Field
                  label="센트비를 어떻게 알게 되셨나요"
                  value={REFERRAL_LABELS[str('referralSource')] ?? str('referralSource')}
                />
              )}
              {str('additionalNote') && (
                <Field label="추가 문의사항" value={str('additionalNote')} />
              )}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate('/customer/onboarding')}
            className="flex-1"
          >
            <ArrowLeft size={16} />
            수정하기
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            확인하고 계속하기
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
