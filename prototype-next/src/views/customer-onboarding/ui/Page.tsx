'use client'

import styled from '@emotion/styled'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useForm, Controller } from 'react-hook-form'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { getRuleSet } from '@/src/entities/rule/model/ruleStore'
import { saveFirstIntakeDraft } from '@/src/features/case-actions/api/caseService'
import {
  createFirstIntakeSchema,
  type FirstIntakeData,
} from '@/src/features/case-validation/model/schemas'
import { colors } from '@/src/shared/const/tokens'
import Button from '@/src/shared/ui/Button'
import Input from '@/src/shared/ui/Input'
import Select from '@/src/shared/ui/Select'
import Textarea from '@/src/shared/ui/Textarea'

function formatPhone(raw: string): string {
  return raw.replace(/[^0-9+\-\s()]/g, '')
}

function formatAmount(raw: string): string {
  const digits = raw.replace(/,/g, '').replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

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

const COUNTRY_NAME: Record<string, string> = { KR: '한국', VN: '베트남' }

const INITIAL: FirstIntakeData = {
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
      ? (existingCase.firstIntake.data as Partial<FirstIntakeData>)
      : null

  const [step, setStep] = useState(0)
  const [draftSaved, setDraftSaved] = useState(false)
  const [fcType, setFcType] = useState<'korean' | 'foreign' | ''>(
    draftData?.foundingCountry === 'KR' ? 'korean' : draftData?.foundingCountry ? 'foreign' : ''
  )
  const [foreignCountryText, setForeignCountryText] = useState(
    draftData?.foundingCountry && draftData.foundingCountry !== 'KR'
      ? draftData.foundingCountry
      : ''
  )

  const { control, trigger, handleSubmit, setValue, watch, getValues } = useForm<FirstIntakeData>({
    defaultValues: draftData
      ? { ...INITIAL, ...draftData, agreed: false }
      : { ...INITIAL, email: session?.email ?? '' },
    resolver: zodResolver(createFirstIntakeSchema()),
    mode: 'onSubmit',
  })

  const services = watch('services')
  const collectionCountries = watch('collectionCountries')
  const remittanceTo = watch('remittanceTo')
  const remittanceFrom = watch('remittanceFrom')
  const monthlyVolumeCurrency = watch('monthlyVolumeCurrency')

  function handleServiceToggle(currentServices: string[], value: string): string[] {
    const next = currentServices.includes(value)
      ? currentServices.filter((s) => s !== value)
      : [...currentServices, value]
    if (value === 'collection' && currentServices.includes('collection')) {
      setValue('collectionCountries', [])
    }
    if (!currentServices.includes('collection') && next.includes('collection')) {
      setValue('businessType', 'financial')
    }
    return next
  }

  function toSavePayload(data: FirstIntakeData) {
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
    saveFirstIntakeDraft(toSavePayload(getValues()), session)
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  function onSubmit(data: FirstIntakeData) {
    if (!session) return
    const savedCase = saveFirstIntakeDraft(toSavePayload(data), session)
    useSessionStore.getState().setSession({ ...session, name: data.contactName })
    router.push(`/customer/case/review/first?id=${savedCase.id}`)
  }

  async function handleNext() {
    if (step === 0) {
      const valid = await trigger([
        'companyName',
        'contactName',
        'contactTitle',
        'phone',
        'email',
        'services',
        'collectionCountries',
        'collectionOtherCountry',
        'remittanceFrom',
        'remittanceFromOther',
        'remittanceTo',
        'remittanceToOther',
      ])
      if (!valid) return
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit(onSubmit)()
    }
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
              <Controller
                control={control}
                name="companyName"
                render={({ field, fieldState }) => (
                  <Input
                    label="회사명"
                    required
                    placeholder="예: 주식회사 센트비"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Grid2>
                <Controller
                  control={control}
                  name="contactName"
                  render={({ field, fieldState }) => (
                    <Input
                      label="담당자 이름"
                      required
                      placeholder="홍길동"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="contactTitle"
                  render={({ field, fieldState }) => (
                    <Input
                      label="직함"
                      required
                      placeholder="대리, 과장 등"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <Input
                      label="연락처"
                      required
                      type="tel"
                      placeholder="+82-10-0000-0000"
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Input
                      label="이메일"
                      required
                      type="email"
                      placeholder="example@company.com"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </Grid2>
            </Section>

            <Separator />

            <Section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <SectionLabel>서비스 선택</SectionLabel>
                <span style={{ fontSize: 12, color: colors.n400 }}>(중복 선택 가능)</span>
              </div>

              <Controller
                control={control}
                name="services"
                render={({ field, fieldState }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <OptionCard
                      icon={<PaperPlaneRight size={20} weight="fill" />}
                      label="해외 송금"
                      desc="해외 거래처로 외화를 송금합니다"
                      selected={field.value.includes('remittance')}
                      onClick={() => field.onChange(handleServiceToggle(field.value, 'remittance'))}
                    />
                    <OptionCard
                      icon={<HandCoins size={20} weight="fill" />}
                      label="수금"
                      desc="원화 또는 외화로 대금을 수금합니다"
                      selected={field.value.includes('collection')}
                      onClick={() => field.onChange(handleServiceToggle(field.value, 'collection'))}
                    />
                    {fieldState.error && <ErrorText>{fieldState.error.message}</ErrorText>}
                  </div>
                )}
              />

              {services.includes('collection') && (
                <ServiceBox>
                  <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                    수금 국가 <span style={{ color: colors.negative }}>*</span>
                    <span style={{ fontWeight: 400, marginLeft: 4, color: colors.n400 }}>
                      (중복 선택 가능)
                    </span>
                  </p>
                  <Controller
                    control={control}
                    name="collectionCountries"
                    render={({ field, fieldState }) => {
                      const rs = getRuleSet()
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
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <ChipRow>
                            {opts.map((c) => (
                              <ToggleChip
                                key={c.value}
                                label={c.label}
                                selected={field.value.includes(c.value)}
                                onClick={() => {
                                  const next = field.value.includes(c.value)
                                    ? field.value.filter((v) => v !== c.value)
                                    : [...field.value, c.value]
                                  field.onChange(next)
                                }}
                              />
                            ))}
                          </ChipRow>
                          {fieldState.error && <ErrorText>{fieldState.error.message}</ErrorText>}
                        </div>
                      )
                    }}
                  />
                  {collectionCountries.includes('OTHER') && (
                    <Controller
                      control={control}
                      name="collectionOtherCountry"
                      render={({ field, fieldState }) => (
                        <Input
                          placeholder="수금 국가를 직접 입력해주세요"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                </ServiceBox>
              )}

              {services.includes('remittance') && (
                <ServiceBox>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                      송금 출발 국가 <span style={{ color: colors.negative }}>*</span>
                    </p>
                    <Controller
                      control={control}
                      name="remittanceFrom"
                      render={({ field, fieldState }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <ChipRow>
                            {REMITTANCE_COUNTRIES.map((c) => (
                              <ToggleChip
                                key={c.value}
                                label={c.label}
                                selected={field.value === c.value}
                                onClick={() => {
                                  field.onChange(c.value)
                                  setValue('remittanceFromOther', '')
                                }}
                              />
                            ))}
                            <ToggleChip
                              label="기타"
                              selected={field.value === '__OTHER__'}
                              onClick={() => field.onChange('__OTHER__')}
                            />
                          </ChipRow>
                          {fieldState.error && <ErrorText>{fieldState.error.message}</ErrorText>}
                        </div>
                      )}
                    />
                    {remittanceFrom === '__OTHER__' && (
                      <Controller
                        control={control}
                        name="remittanceFromOther"
                        render={({ field, fieldState }) => (
                          <Input
                            placeholder="출발 국가를 직접 입력해주세요"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: colors.n700, margin: 0 }}>
                      송금 도착 국가 <span style={{ color: colors.negative }}>*</span>
                      <span style={{ fontWeight: 400, marginLeft: 4, color: colors.n400 }}>
                        (중복 선택 가능)
                      </span>
                    </p>
                    <Controller
                      control={control}
                      name="remittanceTo"
                      render={({ field, fieldState }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <ChipRow>
                            {REMITTANCE_COUNTRIES.map((c) => (
                              <ToggleChip
                                key={c.value}
                                label={c.label}
                                selected={field.value.includes(c.value)}
                                onClick={() => {
                                  const next = field.value.includes(c.value)
                                    ? field.value.filter((v) => v !== c.value)
                                    : [...field.value, c.value]
                                  field.onChange(next)
                                }}
                              />
                            ))}
                            <ToggleChip
                              label="기타"
                              selected={field.value.includes('__OTHER__')}
                              onClick={() => {
                                if (field.value.includes('__OTHER__')) {
                                  field.onChange(field.value.filter((v) => v !== '__OTHER__'))
                                  setValue('remittanceToOther', '')
                                } else {
                                  field.onChange([...field.value, '__OTHER__'])
                                }
                              }}
                            />
                          </ChipRow>
                          {fieldState.error && <ErrorText>{fieldState.error.message}</ErrorText>}
                        </div>
                      )}
                    />
                    {remittanceTo.includes('__OTHER__') && (
                      <Controller
                        control={control}
                        name="remittanceToOther"
                        render={({ field, fieldState }) => (
                          <Input
                            placeholder="도착 국가를 직접 입력해주세요"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    )}
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
              {services.includes('collection') && (
                <InfoNote>
                  수금 서비스 이용 시 사업자 유형이{' '}
                  <strong style={{ color: colors.n800 }}>금융기관(PG사·PSP·MSB 등)</strong>
                  으로 자동 설정됩니다.
                </InfoNote>
              )}
              <Controller
                control={control}
                name="businessType"
                render={({ field, fieldState }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <OptionCard
                      icon={<Buildings size={20} weight="fill" />}
                      label="법인 사업자"
                      desc="주식회사, 유한회사 등 법인 형태의 사업자"
                      selected={field.value === 'corporation'}
                      onClick={() => field.onChange('corporation')}
                      disabled={services.includes('collection')}
                    />
                    <OptionCard
                      icon={<User size={20} weight="fill" />}
                      label="개인 사업자"
                      desc="개인 명의로 사업자등록을 한 사업자"
                      selected={field.value === 'individual'}
                      onClick={() => field.onChange('individual')}
                      disabled={services.includes('collection')}
                    />
                    <OptionCard
                      icon={<Bank size={20} weight="fill" />}
                      label="금융기관(PG사·PSP·MSB 등)"
                      desc="은행, 보험, 증권 등 금융 관련 업종"
                      selected={field.value === 'financial'}
                      onClick={() => field.onChange('financial')}
                      disabled={services.includes('collection')}
                    />
                    {fieldState.error && <ErrorText>{fieldState.error.message}</ErrorText>}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="foundingCountry"
                render={({ field, fieldState }) => (
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
                              field.onChange('KR')
                            } else {
                              field.onChange(foreignCountryText)
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
                          field.onChange(e.target.value)
                        }}
                        error={fieldState.error?.message}
                      />
                    )}
                    {fcType !== 'foreign' && fieldState.error && (
                      <ErrorText>{fieldState.error.message}</ErrorText>
                    )}
                  </div>
                )}
              />
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
                    <Controller
                      control={control}
                      name="monthlyVolume"
                      render={({ field, fieldState }) => (
                        <Input
                          inputMode="numeric"
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => field.onChange(formatAmount(e.target.value))}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </FlexInputWrap>
                  <FixedSelectWrap>
                    <Controller
                      control={control}
                      name="monthlyVolumeCurrency"
                      render={({ field }) => (
                        <Select
                          options={CURRENCY_OPTIONS}
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            if (e.target.value !== 'OTHER')
                              setValue('monthlyVolumeCurrencyOther', '')
                          }}
                        />
                      )}
                    />
                  </FixedSelectWrap>
                </VolumeRow>
                {monthlyVolumeCurrency === 'OTHER' && (
                  <Controller
                    control={control}
                    name="monthlyVolumeCurrencyOther"
                    render={({ field, fieldState }) => (
                      <Input
                        placeholder="통화를 직접 입력해주세요 (예: SGD)"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              </div>
            </Section>

            <Separator />

            <Section>
              <SectionLabel>추가 정보</SectionLabel>
              <Controller
                control={control}
                name="referralSource"
                render={({ field, fieldState }) => (
                  <Select
                    label="센트비를 어떻게 알게 되셨나요?"
                    required
                    options={REFERRAL_OPTIONS}
                    placeholder="선택해주세요"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="additionalNote"
                render={({ field }) => (
                  <Textarea
                    label="추가 문의사항 (선택)"
                    placeholder="궁금하신 내용이 있으면 자유롭게 입력해주세요."
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={3}
                  />
                )}
              />
            </Section>

            <div
              style={{
                paddingTop: 8,
                borderTop: `1px solid ${colors.n100}`,
              }}
            >
              <Controller
                control={control}
                name="agreed"
                render={({ field, fieldState }) => (
                  <>
                    <CheckboxLabel onClick={() => field.onChange(!field.value)}>
                      <CheckboxBox checked={field.value} hasError={!!fieldState.error}>
                        {field.value && <Check size={12} weight="bold" color={colors.white} />}
                      </CheckboxBox>
                      <CheckboxText hasError={!!fieldState.error}>
                        <strong>개인정보 수집 및 이용</strong>에 동의합니다.{' '}
                        <span style={{ color: colors.negative }}>*</span>
                      </CheckboxText>
                    </CheckboxLabel>
                    {fieldState.error && (
                      <ErrorText style={{ marginTop: 6, marginLeft: 30 }}>
                        {fieldState.error.message}
                      </ErrorText>
                    )}
                  </>
                )}
              />
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
