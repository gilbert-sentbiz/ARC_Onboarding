'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Buildings,
  Bank,
  User,
  PaperPlaneRight,
} from '@phosphor-icons/react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import { getMyCase } from '@/services/api/cases'
import { saveFirstIntakeDraft } from '@/services/caseService'
import { useCaseStore } from '@/store/caseStore'
import { useIntakeResponseStore } from '@/store/intakeResponseStore'
import { getRuleSet } from '@/store/ruleStore'
import { validatePhone, validateEmail, validateAmount } from '@/services/validators'

type FormData = {
  companyName: string
  contactName: string
  contactTitle: string
  phone: string
  email: string
  services: string[]
  collectionCountries: string[]
  collectionOtherCountry: string
  remittanceFrom: string
  remittanceFromOther: string
  remittanceTo: string[]
  remittanceToOther: string
  businessType: string
  foundingCountry: string
  monthlyVolume: string
  monthlyVolumeCurrency: string
  monthlyVolumeCurrencyOther: string
  referralSource: string
  additionalNote: string
  agreed: boolean
}

type Errors = Partial<Record<keyof FormData | 'services' | 'collectionCountries' | 'remittanceTo', string>>

const REMITTANCE_COUNTRIES = [
  { value: 'KR', label: '한국' },
  { value: 'US', label: '미국' },
  { value: 'CN', label: '중국' },
  { value: 'JP', label: '일본' },
  { value: 'VN', label: '베트남' },
  { value: 'SG', label: '싱가포르' },
  { value: 'MY', label: '말레이시아' },
  { value: 'PH', label: '필리핀' },
  { value: 'TH', label: '태국' },
  { value: 'ID', label: '인도네시아' },
]

const INITIAL: FormData = {
  companyName: '',
  contactName: '',
  contactTitle: '',
  phone: '',
  email: '',
  services: ['remittance'],
  collectionCountries: [],
  collectionOtherCountry: '',
  remittanceFrom: '',
  remittanceFromOther: '',
  remittanceTo: [],
  remittanceToOther: '',
  businessType: '',
  foundingCountry: '',
  monthlyVolume: '',
  monthlyVolumeCurrency: 'USD',
  monthlyVolumeCurrencyOther: '',
  referralSource: '',
  additionalNote: '',
  agreed: false,
}

function formatPhone(raw: string): string {
  // Allow digits, +, -, space — strip all other chars
  return raw.replace(/[^0-9+\-\s()]/g, '')
}

function formatAmount(raw: string): string {
  const digits = raw.replace(/,/g, '').replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const REFERRAL_OPTIONS = [
  { value: 'search', label: '검색 (네이버·구글 등)' },
  { value: 'referral', label: '지인 추천' },
  { value: 'sns', label: 'SNS' },
  { value: 'news', label: '뉴스 기사' },
  { value: 'other', label: '기타' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KRW', label: 'KRW' },
  { value: 'CNY', label: 'CNY' },
  { value: 'JPY', label: 'JPY' },
  { value: 'VND', label: 'VND' },
  { value: 'OTHER', label: '기타' },
]

// ── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] font-semibold tracking-[1px] uppercase pt-2"
      style={{ color: 'var(--sb-brand)' }}
    >
      {children}
    </p>
  )
}

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 h-10 rounded-[6px] border text-[14px] font-medium transition-all duration-[120ms]"
      style={
        selected
          ? { background: 'var(--sb-blue-150)', borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }
          : { background: 'white', borderColor: 'var(--sb-n200)', color: 'var(--sb-n700)' }
      }
    >
      {selected && <Check size={14} weight="bold" />}
      {label}
    </button>
  )
}

function OptionCard({
  icon, label, desc, selected, onClick, disabled,
}: { icon: React.ReactNode; label: string; desc: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className="flex items-center gap-4 p-4 rounded-[10px] border text-left transition-all duration-[120ms]"
      style={
        disabled && selected
          ? { background: 'var(--sb-blue-100)', borderColor: 'var(--sb-brand)', cursor: 'not-allowed', opacity: 0.8, pointerEvents: 'none' }
          : disabled
          ? { background: 'var(--sb-n50)', borderColor: 'var(--sb-n100)', cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' }
          : selected
          ? { background: 'var(--sb-blue-100)', borderColor: 'var(--sb-brand)' }
          : { background: 'white', borderColor: 'var(--sb-n200)' }
      }
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-[120ms]"
        style={
          disabled && selected
            ? { background: 'var(--sb-brand)', color: 'white' }
            : disabled
            ? { background: 'var(--sb-n100)', color: 'var(--sb-n400)' }
            : selected
            ? { background: 'var(--sb-brand)', color: 'white' }
            : { background: 'var(--sb-n100)', color: 'var(--sb-n500)' }
        }
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p
          className="text-[14px] font-semibold leading-[20px]"
          style={{
            color: disabled && selected
              ? 'var(--sb-brand)'
              : disabled
              ? 'var(--sb-n400)'
              : selected
              ? 'var(--sb-brand)'
              : 'var(--sb-n800)',
          }}
        >
          {label}
        </p>
        <p className="text-[12px] leading-[18px]" style={{ color: 'var(--sb-n500)' }}>{desc}</p>
      </div>
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

export default function OnboardingForm() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)

  // PI-241 가드: 서버에 제출완료(비-신규) 케이스가 있으면 상태 페이지로 리다이렉트 → 중복 케이스 생성 차단.
  useEffect(() => {
    const token = useSessionStore.getState().token
    if (!token) return
    let cancelled = false
    getMyCase(token)
      .then((mine) => {
        if (cancelled || !mine?.id) return
        // 진행 중 케이스(INQUIRY_RECEIVED=1차 미제출 신규, COMPLETED/CLOSED=종료 제외)만
        // 상태 페이지로 보내 중복 생성 차단. 종료된 케이스면 새 온보딩 허용(PI-245).
        const s = mine.status
        const isActive = s && s !== 'INQUIRY_RECEIVED' && s !== 'COMPLETED' && s !== 'CLOSED'
        if (isActive) {
          router.replace(`/customer/case?id=${mine.id}`)
        }
      })
      .catch(() => { /* 조회 실패 → 로컬 흐름 유지 */ })
    return () => { cancelled = true }
  }, [router])

  const existingCase = useCaseStore((s) => {
    if (!session?.email) return null
    return Object.values(s.cases).find(c => c.customerEmail === session.email) ?? null
  })
  const firstIntakeDraft = useIntakeResponseStore((s) => {
    if (!existingCase) return null
    const r = s.getByCase(existingCase.id, 'first')
    return r?.status === 'draft' ? r : null
  })
  const draftData = firstIntakeDraft
    ? firstIntakeDraft.answers as Partial<FormData>
    : null

  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(() =>
    draftData
      ? { ...INITIAL, ...draftData, agreed: false }
      : { ...INITIAL, email: session?.email ?? '' }
  )
  const [errors, setErrors] = useState<Errors>({})
  const [draftSaved, setDraftSaved] = useState(false)

  const [fcType, setFcType] = useState<'korean' | 'foreign' | ''>(
    draftData?.foundingCountry === 'KR' ? 'korean' : draftData?.foundingCountry ? 'foreign' : ''
  )
  const [foreignCountryText, setForeignCountryText] = useState(
    draftData?.foundingCountry && draftData.foundingCountry !== 'KR' ? draftData.foundingCountry : ''
  )

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }


  function toggleCollectionCountry(value: string) {
    setData((prev) => ({
      ...prev,
      collectionCountries: prev.collectionCountries.includes(value)
        ? prev.collectionCountries.filter((c) => c !== value)
        : [...prev.collectionCountries, value],
    }))
    setErrors((prev) => ({ ...prev, collectionCountries: undefined }))
  }

  function validateStep(): boolean {
    const next: Errors = {}

    if (step === 0) {
      if (!data.companyName.trim()) next.companyName = '필수 항목입니다.'
      if (!data.contactName.trim()) next.contactName = '필수 항목입니다.'
      if (!data.contactTitle.trim()) next.contactTitle = '필수 항목입니다.'
      if (!data.phone.trim()) next.phone = '필수 항목입니다.'
      else { const e = validatePhone(data.phone); if (e) next.phone = e }
      if (!data.email.trim()) next.email = '필수 항목입니다.'
      else { const e = validateEmail(data.email); if (e) next.email = e }
      if (data.services.includes('remittance')) {
        const fromVal = data.remittanceFrom === '__OTHER__' ? data.remittanceFromOther : data.remittanceFrom
        if (!fromVal.trim()) next.remittanceFrom = '필수 항목입니다.'
        if (data.remittanceTo.length === 0) next.remittanceTo = '도착 국가를 하나 이상 선택해주세요.'
        if (data.remittanceTo.includes('__OTHER__') && !data.remittanceToOther.trim())
          next.remittanceToOther = '도착 국가를 직접 입력해주세요.'
      }
    }

    if (step === 1) {
      if (!data.businessType) next.businessType = '사업자 유형을 선택해주세요.'
      if (!data.foundingCountry.trim()) next.foundingCountry = fcType === 'foreign' ? '국가명을 입력해주세요.' : '설립 국가를 선택해주세요.'
      if (!data.monthlyVolume.trim()) next.monthlyVolume = '필수 항목입니다.'
      else { const e = validateAmount(data.monthlyVolume); if (e) next.monthlyVolume = e }
      if (data.monthlyVolumeCurrency === 'OTHER' && !data.monthlyVolumeCurrencyOther.trim())
        next.monthlyVolumeCurrencyOther = '통화를 직접 입력해주세요.'
      if (!data.referralSource) next.referralSource = '선택해주세요.'
      if (!data.agreed) next.agreed = '동의가 필요합니다.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleNext() {
    if (!validateStep()) return
    if (step === 0) {
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  function toSaveData() {
    const fromVal = data.remittanceFrom === '__OTHER__' ? data.remittanceFromOther : data.remittanceFrom
    const toArr = [
      ...data.remittanceTo.filter((c) => c !== '__OTHER__'),
      ...(data.remittanceTo.includes('__OTHER__') && data.remittanceToOther.trim() ? [data.remittanceToOther.trim()] : []),
    ]
    return { ...data, remittanceFrom: fromVal, remittanceTo: toArr.join(', ') }
  }

  function handleDraftSave() {
    if (!session) return
    saveFirstIntakeDraft(toSaveData(), session)
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  function handleSubmit() {
    if (!session) return
    const savedCase = saveFirstIntakeDraft(toSaveData(), session)
    // PI-233: 담당자 이름만 갱신 — 기존 OTP 토큰을 함께 전달해 소실 방지
    const { token } = useSessionStore.getState()
    useSessionStore.getState().setSession({ ...session, name: data.contactName }, token ?? undefined)
    router.push(`/customer/case/review/first?id=${savedCase.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: 'var(--sb-n50)' }}>
      {/* Header */}
      <div className="w-full max-w-[640px] mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push('/') : setStep(0))}
            className="flex items-center gap-1.5 text-[13px] transition-colors"
            style={{ color: 'var(--sb-n500)' }}
          >
            <ArrowLeft size={16} />
            {step === 0 ? '처음으로' : '이전'}
          </button>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDraftSave}
              className="text-[13px] transition-colors font-medium"
              style={{ color: 'var(--sb-brand)' }}
            >
              {draftSaved ? '저장됨 ✓' : '임시저장'}
            </button>
            <span className="text-[13px] font-medium" style={{ color: 'var(--sb-n500)' }}>{step + 1} / 2</span>
          </div>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--sb-n200)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: step === 0 ? '50%' : '100%', background: 'var(--sb-brand)' }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[640px] bg-white rounded-[16px] p-8 flex flex-col gap-7"
        style={{ boxShadow: 'var(--shadow-200)' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] leading-[30px] font-bold" style={{ color: 'var(--sb-n900)' }}>
            {step === 0 ? '기본 정보를 입력해주세요' : '사업자 정보를 입력해주세요'}
          </h2>
          <p className="text-[14px] leading-[20px]" style={{ color: 'var(--sb-n500)' }}>
            {step === 0
              ? '담당자 정보와 이용하실 서비스를 선택해주세요.'
              : '사업자 정보와 거래 규모를 입력해주세요.'}
          </p>
        </div>

        {/* ── Step 0 ── */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <SectionLabel>담당자 정보</SectionLabel>
              <Input
                label="회사명"
                required
                placeholder="예: 주식회사 센트비"
                value={data.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                error={errors.companyName}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="담당자 이름"
                  required
                  placeholder="홍길동"
                  value={data.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  error={errors.contactName}
                />
                <Input
                  label="직함"
                  required
                  placeholder="대리, 과장 등"
                  value={data.contactTitle}
                  onChange={(e) => set('contactTitle', e.target.value)}
                  error={errors.contactTitle}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="연락처"
                  required
                  type="tel"
                  placeholder="+82-10-0000-0000"
                  value={data.phone}
                  onChange={(e) => set('phone', formatPhone(e.target.value))}
                  onBlur={() => {
                    if (data.phone) {
                      const e = validatePhone(data.phone)
                      if (e) setErrors(prev => ({ ...prev, phone: e }))
                    }
                  }}
                  error={errors.phone}
                />
                <Input
                  label="이메일"
                  required
                  type="email"
                  placeholder="example@company.com"
                  value={data.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={errors.email}
                />
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--sb-n100)' }} />

            <div className="flex flex-col gap-4">
              <SectionLabel>서비스 선택</SectionLabel>
              <div className="flex flex-col gap-3">
                <OptionCard
                  icon={<PaperPlaneRight size={20} weight="fill" />}
                  label="해외 송금"
                  desc="해외 거래처로 외화를 송금합니다"
                  selected
                  onClick={() => {}}
                />
              </div>

              {/* 수금 국가 */}
              {data.services.includes('collection') && (
                <div
                  className="flex flex-col gap-3 p-4 rounded-[10px] border"
                  style={{ background: 'var(--sb-n50)', borderColor: 'var(--sb-n200)' }}
                >
                  <p className="text-[13px] font-medium" style={{ color: 'var(--sb-n700)' }}>
                    수금 국가 <span style={{ color: 'var(--sb-negative)' }}>*</span>
                    <span className="font-normal ml-1" style={{ color: 'var(--sb-n400)' }}>(중복 선택 가능)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const rs = getRuleSet()
                      const COUNTRY_NAME: Record<string, string> = { KR: '한국', VN: '베트남' }
                      const opts = [
                        ...rs.serviceClassificationRules
                          .filter(r => r.triggerServices.includes('collection') && r.triggerCountries.length > 0)
                          .map(r => ({ value: r.triggerCountries[0], label: COUNTRY_NAME[r.triggerCountries[0]] ?? r.triggerCountries[0] })),
                        { value: 'OTHER', label: '기타' },
                      ]
                      return opts.map((c) => (
                        <ToggleChip
                          key={c.value}
                          label={c.label}
                          selected={data.collectionCountries.includes(c.value)}
                          onClick={() => toggleCollectionCountry(c.value)}
                        />
                      ))
                    })()}
                  </div>
                  {data.collectionCountries.includes('OTHER') && (
                    <Input
                      placeholder="수금 국가를 직접 입력해주세요"
                      value={data.collectionOtherCountry}
                      onChange={(e) => set('collectionOtherCountry', e.target.value)}
                    />
                  )}
                  {errors.collectionCountries && (
                    <p className="text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.collectionCountries}</p>
                  )}
                </div>
              )}

              {/* 송금 국가 */}
              {data.services.includes('remittance') && (
                <div
                  className="flex flex-col gap-4 p-4 rounded-[10px] border"
                  style={{ background: 'var(--sb-n50)', borderColor: 'var(--sb-n200)' }}
                >
                  {/* 출발 국가 — single select */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-medium" style={{ color: 'var(--sb-n700)' }}>
                      송금 출발 국가 <span style={{ color: 'var(--sb-negative)' }}>*</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REMITTANCE_COUNTRIES.map((c) => (
                        <ToggleChip
                          key={c.value}
                          label={c.label}
                          selected={data.remittanceFrom === c.value}
                          onClick={() => { set('remittanceFrom', c.value); set('remittanceFromOther', '') }}
                        />
                      ))}
                      <ToggleChip
                        label="기타"
                        selected={data.remittanceFrom === '__OTHER__'}
                        onClick={() => set('remittanceFrom', '__OTHER__')}
                      />
                    </div>
                    {data.remittanceFrom === '__OTHER__' && (
                      <Input
                        placeholder="출발 국가를 직접 입력해주세요"
                        value={data.remittanceFromOther}
                        onChange={(e) => set('remittanceFromOther', e.target.value)}
                      />
                    )}
                    {errors.remittanceFrom && (
                      <p className="text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.remittanceFrom}</p>
                    )}
                  </div>

                  {/* 도착 국가 — multi select */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-medium" style={{ color: 'var(--sb-n700)' }}>
                      송금 도착 국가 <span style={{ color: 'var(--sb-negative)' }}>*</span>
                      <span className="font-normal ml-1" style={{ color: 'var(--sb-n400)' }}>(중복 선택 가능)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REMITTANCE_COUNTRIES.map((c) => (
                        <ToggleChip
                          key={c.value}
                          label={c.label}
                          selected={data.remittanceTo.includes(c.value)}
                          onClick={() => {
                            set('remittanceTo', data.remittanceTo.includes(c.value)
                              ? data.remittanceTo.filter((v) => v !== c.value)
                              : [...data.remittanceTo, c.value])
                          }}
                        />
                      ))}
                      <ToggleChip
                        label="기타"
                        selected={data.remittanceTo.includes('__OTHER__')}
                        onClick={() => {
                          set('remittanceTo', data.remittanceTo.includes('__OTHER__')
                            ? data.remittanceTo.filter((v) => v !== '__OTHER__')
                            : [...data.remittanceTo, '__OTHER__'])
                          if (data.remittanceTo.includes('__OTHER__')) set('remittanceToOther', '')
                        }}
                      />
                    </div>
                    {data.remittanceTo.includes('__OTHER__') && (
                      <Input
                        placeholder="도착 국가를 직접 입력해주세요"
                        value={data.remittanceToOther}
                        onChange={(e) => set('remittanceToOther', e.target.value)}
                        error={errors.remittanceToOther}
                      />
                    )}
                    {errors.remittanceTo && (
                      <p className="text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.remittanceTo}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <SectionLabel>사업자 정보</SectionLabel>
              {data.services.includes('collection') && (
                <p
                  className="text-[12px] rounded-[8px] px-3 py-2 border"
                  style={{ color: 'var(--sb-n500)', background: 'var(--sb-n50)', borderColor: 'var(--sb-n100)' }}
                >
                  수금 서비스 이용 시 사업자 유형이 <span className="font-medium" style={{ color: 'var(--sb-n800)' }}>금융기관(PG사·PSP·MSB 등)</span>으로 자동 설정됩니다.
                </p>
              )}
              <div className="flex flex-col gap-3">
                <OptionCard
                  icon={<Buildings size={20} weight="fill" />}
                  label="법인 사업자"
                  desc="주식회사, 유한회사 등 법인 형태의 사업자"
                  selected={data.businessType === 'corporation'}
                  onClick={() => set('businessType', 'corporation')}
                  disabled={data.services.includes('collection')}
                />
                <OptionCard
                  icon={<User size={20} weight="fill" />}
                  label="개인 사업자"
                  desc="개인 명의로 사업자등록을 한 사업자"
                  selected={data.businessType === 'individual'}
                  onClick={() => set('businessType', 'individual')}
                  disabled={data.services.includes('collection')}
                />
                <OptionCard
                  icon={<Bank size={20} weight="fill" />}
                  label="금융기관(PG사·PSP·MSB 등)"
                  desc="은행, 보험, 증권 등 금융 관련 업종"
                  selected={data.businessType === 'financial'}
                  onClick={() => set('businessType', 'financial')}
                  disabled={data.services.includes('collection')}
                />
              </div>
              {errors.businessType && (
                <p className="text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.businessType}</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px]" style={{ color: 'var(--sb-n500)' }}>
                  법인·사업자 설립 국가 <span style={{ color: 'var(--sb-negative)' }}>*</span>
                </label>
                <div className="flex gap-2">
                  {(['korean', 'foreign'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFcType(type)
                        if (type === 'korean') {
                          set('foundingCountry', 'KR')
                        } else {
                          set('foundingCountry', foreignCountryText)
                        }
                      }}
                      className="flex-1 py-2.5 rounded-[8px] border text-[14px] font-medium transition-all duration-[120ms]"
                      style={
                        fcType === type
                          ? { background: 'var(--sb-blue-100)', borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }
                          : { background: 'white', borderColor: 'var(--sb-n200)', color: 'var(--sb-n500)' }
                      }
                    >
                      {type === 'korean' ? '한국' : '해외'}
                    </button>
                  ))}
                </div>
                {fcType === 'foreign' && (
                  <Input
                    placeholder="국가명 입력 (예: 미국)"
                    value={foreignCountryText}
                    onChange={(e) => {
                      setForeignCountryText(e.target.value)
                      set('foundingCountry', e.target.value)
                    }}
                    error={errors.foundingCountry}
                  />
                )}
                {fcType !== 'foreign' && errors.foundingCountry && (
                  <p className="text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.foundingCountry}</p>
                )}
              </div>
            </div>

            {(fcType === 'foreign' || data.services.includes('collection')) && (
              <div className="p-4 rounded-[10px] flex flex-col gap-1" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
                <p className="text-[13px] font-semibold" style={{ color: '#b45309' }}>현재 서비스 준비 중입니다</p>
                <p className="text-[12px]" style={{ color: '#d97706' }}>
                  {data.services.includes('collection')
                    ? '수금(Collection) 서비스는 현재 준비 중입니다. 송금 서비스로 진행해주세요.'
                    : '해외에 설립된 기업(법인·개인·금융기관)의 온보딩은 현재 준비 중입니다. 국내 사업자 고객은 계속 진행하실 수 있습니다.'}
                </p>
              </div>
            )}

            <div className="h-px" style={{ background: 'var(--sb-n100)' }} />

            <div className="flex flex-col gap-4">
              <SectionLabel>거래 규모</SectionLabel>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px]" style={{ color: 'var(--sb-n500)' }}>
                  예상 월간 거래 규모 <span style={{ color: 'var(--sb-negative)' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    inputMode="numeric"
                    placeholder="0"
                    value={data.monthlyVolume}
                    onChange={(e) => set('monthlyVolume', formatAmount(e.target.value))}
                    error={errors.monthlyVolume}
                  />
                  <Select
                    className="w-28"
                    options={CURRENCY_OPTIONS}
                    value={data.monthlyVolumeCurrency}
                    onChange={(e) => {
                      set('monthlyVolumeCurrency', e.target.value)
                      if (e.target.value !== 'OTHER') set('monthlyVolumeCurrencyOther', '')
                    }}
                  />
                </div>
                {data.monthlyVolumeCurrency === 'OTHER' && (
                  <Input
                    placeholder="통화를 직접 입력해주세요 (예: SGD)"
                    value={data.monthlyVolumeCurrencyOther}
                    onChange={(e) => set('monthlyVolumeCurrencyOther', e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--sb-n100)' }} />

            <div className="flex flex-col gap-4">
              <SectionLabel>추가 정보</SectionLabel>
              <Select
                label="센트비를 어떻게 알게 되셨나요?"
                required
                options={REFERRAL_OPTIONS}
                placeholder="선택해주세요"
                value={data.referralSource}
                onChange={(e) => {
                  set('referralSource', e.target.value)
                  setErrors((prev) => ({ ...prev, referralSource: undefined }))
                }}
                error={errors.referralSource}
              />
              <Textarea
                label="추가 문의사항 (선택)"
                placeholder="궁금하신 내용이 있으면 자유롭게 입력해주세요."
                value={data.additionalNote}
                onChange={(e) => set('additionalNote', e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--sb-n100)' }}>
              <label
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => {
                  set('agreed', !data.agreed)
                  setErrors((prev) => ({ ...prev, agreed: undefined }))
                }}
              >
                <div
                  className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms]"
                  style={
                    data.agreed
                      ? { background: 'var(--sb-brand)', borderColor: 'var(--sb-brand)' }
                      : errors.agreed
                      ? { borderColor: 'var(--sb-negative)', background: 'var(--sb-negative-light)' }
                      : { borderColor: 'var(--sb-n300)', background: 'white' }
                  }
                >
                  {data.agreed && <Check size={12} weight="bold" className="text-white" />}
                </div>
                <span
                  className="text-[13px] leading-[20px]"
                  style={{ color: errors.agreed ? 'var(--sb-negative)' : 'var(--sb-n600)' }}
                >
                  <span className="font-medium">개인정보 수집 및 이용</span>에 동의합니다. <span style={{ color: 'var(--sb-negative)' }}>*</span>
                </span>
              </label>
              {errors.agreed && (
                <p className="mt-1.5 ml-[30px] text-[11px]" style={{ color: 'var(--sb-negative)' }}>{errors.agreed}</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step === 1 && (
            <Button variant="outline" onClick={() => { setStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex-1">
              <ArrowLeft size={16} />
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            fullWidth={step === 0}
            className="flex-1"
            disabled={step === 1 && (fcType === 'foreign' || data.services.includes('collection'))}
          >
            {step === 1 ? '제출하기' : '다음'}
            {step === 0 && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
