'use client'

import styled from '@emotion/styled'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Buildings,
  Bank,
  User,
  PaperPlaneRight,
  HandCoins,
} from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { getRuleSet } from '@/src/entities/rule/model/ruleStore'
import { saveFirstIntakeDraft } from '@/src/features/case-actions/api/caseService'
import {
  validatePhone,
  validateEmail,
  validateAmount,
} from '@/src/features/case-validation/model/validators'
import { colors } from '@/src/shared/const/tokens'
import Button from '@/src/shared/ui/Button'
import Input from '@/src/shared/ui/Input'
import Select from '@/src/shared/ui/Select'
import Textarea from '@/src/shared/ui/Textarea'

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

type Errors = Partial<
  Record<keyof FormData | 'services' | 'collectionCountries' | 'remittanceTo', string>
>

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
  services: [],
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

// ── Styled components ──────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background: ${colors.n50};
`

const PageInner = styled.div`
  width: 100%;
  max-width: 640px;
  margin-bottom: 24px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const NavBackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const DraftBtn = styled.button`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.brand};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
`

const StepLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.n500};
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  overflow: hidden;
  background: ${colors.n200};
`

const ProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: width 300ms;
  background: ${colors.brand};
  width: ${({ pct }) => pct}%;
`

const Card = styled.div`
  width: 100%;
  max-width: 640px;
  background: ${colors.white};
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  box-shadow: var(--shadow-200);
`

const CardTitle = styled.h2`
  font-size: 20px;
  line-height: 30px;
  font-weight: 700;
  color: ${colors.n900};
  margin: 0;
`

const CardSubtitle = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: ${colors.n500};
  margin: 0;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SectionLabelEl = styled.p`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding-top: 8px;
  color: ${colors.brand};
  margin: 0;
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const StyledChip = styled.button<{ selected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 14px;
  font-weight: 500;
  transition: all 120ms;
  cursor: pointer;
  background: ${({ selected }) => (selected ? colors.blue150 : colors.white)};
  border-color: ${({ selected }) => (selected ? colors.brand : colors.n200)};
  color: ${({ selected }) => (selected ? colors.brand : colors.n700)};
`

const OptionCardBtn = styled.button<{ selected: boolean; isDisabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid;
  text-align: left;
  transition: all 120ms;
  width: 100%;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};
  opacity: ${({ isDisabled, selected }) => (isDisabled && !selected ? 0.6 : isDisabled ? 0.8 : 1)};
  background: ${({ selected, isDisabled }) =>
    isDisabled && selected
      ? colors.blue100
      : isDisabled
        ? colors.n50
        : selected
          ? colors.blue100
          : colors.white};
  border-color: ${({ selected, isDisabled }) =>
    selected ? colors.brand : isDisabled ? colors.n100 : colors.n200};
`

const OptionCardIcon = styled.div<{ selected: boolean; isDisabled: boolean }>`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms;
  background: ${({ selected, isDisabled }) =>
    isDisabled && selected
      ? colors.brand
      : isDisabled
        ? colors.n100
        : selected
          ? colors.brand
          : colors.n100};
  color: ${({ selected, isDisabled }) =>
    isDisabled && selected
      ? colors.white
      : isDisabled
        ? colors.n400
        : selected
          ? colors.white
          : colors.n500};
`

const OptionCardText = styled.p<{ selected: boolean; isDisabled: boolean }>`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  margin: 0;
  color: ${({ selected, isDisabled }) =>
    isDisabled && selected
      ? colors.brand
      : isDisabled
        ? colors.n400
        : selected
          ? colors.brand
          : colors.n800};
`

const OptionCardDesc = styled.p`
  font-size: 12px;
  line-height: 18px;
  color: ${colors.n500};
  margin: 0;
`

const ServiceBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${colors.n200};
  background: ${colors.n50};
`

const FieldLabel = styled.label`
  font-size: 14px;
  color: ${colors.n500};
`

const ErrorText = styled.p`
  font-size: 11px;
  color: ${colors.negative};
  margin: 0;
`

const InfoNote = styled.p`
  font-size: 12px;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid ${colors.n100};
  color: ${colors.n500};
  background: ${colors.n50};
  margin: 0;
`

const OriginToggleRow = styled.div`
  display: flex;
  gap: 8px;
`

const OriginToggleBtn = styled.button<{ selected: boolean }>`
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid;
  font-size: 14px;
  font-weight: 500;
  transition: all 120ms;
  cursor: pointer;
  background: ${({ selected }) => (selected ? colors.blue100 : colors.white)};
  border-color: ${({ selected }) => (selected ? colors.brand : colors.n200)};
  color: ${({ selected }) => (selected ? colors.brand : colors.n500)};
`

const VolumeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`

const FlexInputWrap = styled.div`
  flex: 1;
`

const FixedSelectWrap = styled.div`
  width: 112px;
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
`

const CheckboxBox = styled.div<{ checked: boolean; hasError: boolean }>`
  margin-top: 2px;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms;
  background: ${({ checked, hasError }) =>
    checked ? colors.brand : hasError ? colors.negativeLight : colors.white};
  border-color: ${({ checked, hasError }) =>
    checked ? colors.brand : hasError ? colors.negative : colors.n300};
`

const CheckboxText = styled.span<{ hasError: boolean }>`
  font-size: 13px;
  line-height: 20px;
  color: ${({ hasError }) => (hasError ? colors.negative : colors.n600)};
`

const Separator = styled.div`
  height: 1px;
  background: ${colors.n100};
`

const NavRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 8px;
`

const FlexBtn = styled.div`
  flex: 1;
`

// ── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <SectionLabelEl>{children}</SectionLabelEl>
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <StyledChip type="button" selected={selected} onClick={onClick}>
      {selected && <Check size={14} weight="bold" />}
      {label}
    </StyledChip>
  )
}

function OptionCard({
  icon,
  label,
  desc,
  selected,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <OptionCardBtn
      type="button"
      selected={selected}
      isDisabled={!!disabled}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
    >
      <OptionCardIcon selected={selected} isDisabled={!!disabled}>
        {icon}
      </OptionCardIcon>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <OptionCardText selected={selected} isDisabled={!!disabled}>
          {label}
        </OptionCardText>
        <OptionCardDesc>{desc}</OptionCardDesc>
      </div>
    </OptionCardBtn>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

export default function CustomerOnboardingPage() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)

  const existingCase = useCaseStore((s) => {
    if (!session?.email) return null
    return Object.values(s.cases).find((c) => c.customerEmail === session.email) ?? null
  })
  const draftData =
    existingCase?.firstIntake?.status === 'draft'
      ? (existingCase.firstIntake.data as Partial<FormData>)
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
    draftData?.foundingCountry && draftData.foundingCountry !== 'KR'
      ? draftData.foundingCountry
      : ''
  )

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggleService(value: string) {
    setData((prev) => {
      const nextServices = prev.services.includes(value)
        ? prev.services.filter((s) => s !== value)
        : [...prev.services, value]
      const collectionOn = nextServices.includes('collection')
      return {
        ...prev,
        services: nextServices,
        collectionCountries:
          value === 'collection' && prev.services.includes('collection')
            ? []
            : prev.collectionCountries,
        ...(collectionOn ? { businessType: 'financial' } : {}),
      }
    })
    setErrors((prev) => ({ ...prev, services: undefined }))
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
      else {
        const e = validatePhone(data.phone)
        if (e) next.phone = e
      }
      if (!data.email.trim()) next.email = '필수 항목입니다.'
      else {
        const e = validateEmail(data.email)
        if (e) next.email = e
      }
      if (data.services.length === 0) next.services = '서비스를 하나 이상 선택해주세요.'
      if (data.services.includes('collection') && data.collectionCountries.length === 0)
        next.collectionCountries = '수금 국가를 하나 이상 선택해주세요.'
      if (data.collectionCountries.includes('OTHER') && !data.collectionOtherCountry.trim())
        next.collectionOtherCountry = '수금 국가를 직접 입력해주세요.'
      if (data.services.includes('remittance')) {
        const fromVal =
          data.remittanceFrom === '__OTHER__' ? data.remittanceFromOther : data.remittanceFrom
        if (!fromVal.trim()) next.remittanceFrom = '필수 항목입니다.'
        if (data.remittanceTo.length === 0)
          next.remittanceTo = '도착 국가를 하나 이상 선택해주세요.'
        if (data.remittanceTo.includes('__OTHER__') && !data.remittanceToOther.trim())
          next.remittanceToOther = '도착 국가를 직접 입력해주세요.'
      }
    }

    if (step === 1) {
      if (!data.businessType) next.businessType = '사업자 유형을 선택해주세요.'
      if (!data.foundingCountry.trim())
        next.foundingCountry =
          fcType === 'foreign' ? '국가명을 입력해주세요.' : '설립 국가를 선택해주세요.'
      if (!data.monthlyVolume.trim()) next.monthlyVolume = '필수 항목입니다.'
      else {
        const e = validateAmount(data.monthlyVolume)
        if (e) next.monthlyVolume = e
      }
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
    const fromVal =
      data.remittanceFrom === '__OTHER__' ? data.remittanceFromOther : data.remittanceFrom
    const toArr = [
      ...data.remittanceTo.filter((c) => c !== '__OTHER__'),
      ...(data.remittanceTo.includes('__OTHER__') && data.remittanceToOther.trim()
        ? [data.remittanceToOther.trim()]
        : []),
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
    useSessionStore.getState().setSession({ ...session, name: data.contactName })
    router.push(`/customer/case/review/first?id=${savedCase.id}`)
  }

  return (
    <Page>
      <PageInner>
        <HeaderRow>
          <NavBackBtn type="button" onClick={() => (step === 0 ? router.push('/') : setStep(0))}>
            <ArrowLeft size={16} />
            {step === 0 ? '처음으로' : '이전'}
          </NavBackBtn>
          <HeaderRight>
            <DraftBtn type="button" onClick={handleDraftSave}>
              {draftSaved ? '저장됨 ✓' : '임시저장'}
            </DraftBtn>
            <StepLabel>{step + 1} / 2</StepLabel>
          </HeaderRight>
        </HeaderRow>
        <ProgressTrack>
          <ProgressFill pct={step === 0 ? 50 : 100} />
        </ProgressTrack>
      </PageInner>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <CardTitle>
            {step === 0 ? '기본 정보를 입력해주세요' : '사업자 정보를 입력해주세요'}
          </CardTitle>
          <CardSubtitle>
            {step === 0
              ? '담당자 정보와 이용하실 서비스를 선택해주세요.'
              : '사업자 정보와 거래 규모를 입력해주세요.'}
          </CardSubtitle>
        </div>

        {/* ── Step 0 ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Section>
              <SectionLabel>담당자 정보</SectionLabel>
              <Input
                label="회사명"
                required
                placeholder="예: 주식회사 센트비"
                value={data.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                error={errors.companyName}
              />
              <Grid2>
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
              </Grid2>
              <Grid2>
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
                      if (e) setErrors((prev) => ({ ...prev, phone: e }))
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
              </Grid2>
            </Section>

            <Separator />

            <Section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <SectionLabel>서비스 선택</SectionLabel>
                <span style={{ fontSize: 12, color: colors.n400 }}>(중복 선택 가능)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <OptionCard
                  icon={<PaperPlaneRight size={20} weight="fill" />}
                  label="해외 송금"
                  desc="해외 거래처로 외화를 송금합니다"
                  selected={data.services.includes('remittance')}
                  onClick={() => toggleService('remittance')}
                />
                <OptionCard
                  icon={<HandCoins size={20} weight="fill" />}
                  label="수금"
                  desc="원화 또는 외화로 대금을 수금합니다"
                  selected={data.services.includes('collection')}
                  onClick={() => toggleService('collection')}
                />
              </div>
              {errors.services && <ErrorText>{errors.services}</ErrorText>}

              {data.services.includes('collection') && (
                <ServiceBox>
                  <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                    수금 국가 <span style={{ color: colors.negative }}>*</span>
                    <span style={{ fontWeight: 400, marginLeft: 4, color: colors.n400 }}>
                      (중복 선택 가능)
                    </span>
                  </p>
                  <ChipRow>
                    {(() => {
                      const rs = getRuleSet()
                      const COUNTRY_NAME: Record<string, string> = { KR: '한국', VN: '베트남' }
                      const opts = [
                        ...rs.serviceClassificationRules
                          .filter(
                            (r) =>
                              r.triggerServices.includes('collection') &&
                              r.triggerCountries.length > 0
                          )
                          .map((r) => ({
                            value: r.triggerCountries[0],
                            label: COUNTRY_NAME[r.triggerCountries[0]] ?? r.triggerCountries[0],
                          })),
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
                  </ChipRow>
                  {data.collectionCountries.includes('OTHER') && (
                    <Input
                      placeholder="수금 국가를 직접 입력해주세요"
                      value={data.collectionOtherCountry}
                      onChange={(e) => set('collectionOtherCountry', e.target.value)}
                    />
                  )}
                  {errors.collectionCountries && (
                    <ErrorText>{errors.collectionCountries}</ErrorText>
                  )}
                </ServiceBox>
              )}

              {data.services.includes('remittance') && (
                <ServiceBox>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                      송금 출발 국가 <span style={{ color: colors.negative }}>*</span>
                    </p>
                    <ChipRow>
                      {REMITTANCE_COUNTRIES.map((c) => (
                        <ToggleChip
                          key={c.value}
                          label={c.label}
                          selected={data.remittanceFrom === c.value}
                          onClick={() => {
                            set('remittanceFrom', c.value)
                            set('remittanceFromOther', '')
                          }}
                        />
                      ))}
                      <ToggleChip
                        label="기타"
                        selected={data.remittanceFrom === '__OTHER__'}
                        onClick={() => set('remittanceFrom', '__OTHER__')}
                      />
                    </ChipRow>
                    {data.remittanceFrom === '__OTHER__' && (
                      <Input
                        placeholder="출발 국가를 직접 입력해주세요"
                        value={data.remittanceFromOther}
                        onChange={(e) => set('remittanceFromOther', e.target.value)}
                      />
                    )}
                    {errors.remittanceFrom && <ErrorText>{errors.remittanceFrom}</ErrorText>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                      송금 도착 국가 <span style={{ color: colors.negative }}>*</span>
                      <span style={{ fontWeight: 400, marginLeft: 4, color: colors.n400 }}>
                        (중복 선택 가능)
                      </span>
                    </p>
                    <ChipRow>
                      {REMITTANCE_COUNTRIES.map((c) => (
                        <ToggleChip
                          key={c.value}
                          label={c.label}
                          selected={data.remittanceTo.includes(c.value)}
                          onClick={() => {
                            set(
                              'remittanceTo',
                              data.remittanceTo.includes(c.value)
                                ? data.remittanceTo.filter((v) => v !== c.value)
                                : [...data.remittanceTo, c.value]
                            )
                          }}
                        />
                      ))}
                      <ToggleChip
                        label="기타"
                        selected={data.remittanceTo.includes('__OTHER__')}
                        onClick={() => {
                          set(
                            'remittanceTo',
                            data.remittanceTo.includes('__OTHER__')
                              ? data.remittanceTo.filter((v) => v !== '__OTHER__')
                              : [...data.remittanceTo, '__OTHER__']
                          )
                          if (data.remittanceTo.includes('__OTHER__')) set('remittanceToOther', '')
                        }}
                      />
                    </ChipRow>
                    {data.remittanceTo.includes('__OTHER__') && (
                      <Input
                        placeholder="도착 국가를 직접 입력해주세요"
                        value={data.remittanceToOther}
                        onChange={(e) => set('remittanceToOther', e.target.value)}
                        error={errors.remittanceToOther}
                      />
                    )}
                    {errors.remittanceTo && <ErrorText>{errors.remittanceTo}</ErrorText>}
                  </div>
                </ServiceBox>
              )}
            </Section>
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Section>
              <SectionLabel>사업자 정보</SectionLabel>
              {data.services.includes('collection') && (
                <InfoNote>
                  수금 서비스 이용 시 사업자 유형이{' '}
                  <strong style={{ color: colors.n800 }}>금융기관(PG사·PSP·MSB 등)</strong>
                  으로 자동 설정됩니다.
                </InfoNote>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              {errors.businessType && <ErrorText>{errors.businessType}</ErrorText>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel>
                  법인·사업자 설립 국가 <span style={{ color: colors.negative }}>*</span>
                </FieldLabel>
                <OriginToggleRow>
                  {(['korean', 'foreign'] as const).map((type) => (
                    <OriginToggleBtn
                      key={type}
                      type="button"
                      selected={fcType === type}
                      onClick={() => {
                        setFcType(type)
                        if (type === 'korean') {
                          set('foundingCountry', 'KR')
                        } else {
                          set('foundingCountry', foreignCountryText)
                        }
                      }}
                    >
                      {type === 'korean' ? '한국' : '해외'}
                    </OriginToggleBtn>
                  ))}
                </OriginToggleRow>
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
                  <ErrorText>{errors.foundingCountry}</ErrorText>
                )}
              </div>
            </Section>

            <Separator />

            <Section>
              <SectionLabel>거래 규모</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel>
                  예상 월간 거래 규모 <span style={{ color: colors.negative }}>*</span>
                </FieldLabel>
                <VolumeRow>
                  <FlexInputWrap>
                    <Input
                      inputMode="numeric"
                      placeholder="0"
                      value={data.monthlyVolume}
                      onChange={(e) => set('monthlyVolume', formatAmount(e.target.value))}
                      error={errors.monthlyVolume}
                    />
                  </FlexInputWrap>
                  <FixedSelectWrap>
                    <Select
                      options={CURRENCY_OPTIONS}
                      value={data.monthlyVolumeCurrency}
                      onChange={(e) => {
                        set('monthlyVolumeCurrency', e.target.value)
                        if (e.target.value !== 'OTHER') set('monthlyVolumeCurrencyOther', '')
                      }}
                    />
                  </FixedSelectWrap>
                </VolumeRow>
                {data.monthlyVolumeCurrency === 'OTHER' && (
                  <Input
                    placeholder="통화를 직접 입력해주세요 (예: SGD)"
                    value={data.monthlyVolumeCurrencyOther}
                    onChange={(e) => set('monthlyVolumeCurrencyOther', e.target.value)}
                  />
                )}
              </div>
            </Section>

            <Separator />

            <Section>
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
            </Section>

            <div
              style={{
                paddingTop: 8,
                borderTop: `1px solid ${colors.n100}`,
              }}
            >
              <CheckboxLabel
                onClick={() => {
                  set('agreed', !data.agreed)
                  setErrors((prev) => ({ ...prev, agreed: undefined }))
                }}
              >
                <CheckboxBox checked={data.agreed} hasError={!!errors.agreed}>
                  {data.agreed && <Check size={12} weight="bold" color={colors.white} />}
                </CheckboxBox>
                <CheckboxText hasError={!!errors.agreed}>
                  <strong>개인정보 수집 및 이용</strong>에 동의합니다.{' '}
                  <span style={{ color: colors.negative }}>*</span>
                </CheckboxText>
              </CheckboxLabel>
              {errors.agreed && (
                <ErrorText style={{ marginTop: 6, marginLeft: 30 }}>{errors.agreed}</ErrorText>
              )}
            </div>
          </div>
        )}

        <NavRow>
          {step === 1 && (
            <FlexBtn>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setStep(0)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <ArrowLeft size={16} />
                이전
              </Button>
            </FlexBtn>
          )}
          <FlexBtn>
            <Button onClick={handleNext} fullWidth>
              {step === 1 ? '제출하기' : '다음'}
              {step === 0 && <ArrowRight size={16} />}
            </Button>
          </FlexBtn>
        </NavRow>
      </Card>
    </Page>
  )
}
