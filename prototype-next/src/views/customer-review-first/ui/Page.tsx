'use client'
import styled from '@emotion/styled'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { colors } from '@/src/shared/const/tokens'
import Button from '@/src/shared/ui/Button'
import { getCountryName } from '@/src/shared/util/countryNames'

const SERVICE_LABELS: Record<string, string> = {
  remittance: '해외 송금',
  collection: '수금',
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  corporation: '법인 사업자',
  individual: '개인 사업자',
  financial: '금융기관(PG사·PSP·MSB 등)',
}

const REFERRAL_LABELS: Record<string, string> = {
  search: '검색 (네이버·구글 등)',
  referral: '지인 추천',
  sns: 'SNS',
  news: '뉴스 기사',
  other: '기타',
}

const PageWrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background: ${colors.n50};
`

const HeaderWrap = styled.div`
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

const BackBtn = styled.button`
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

const StepLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.n500};
`

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background: ${colors.brand};
`

const Card = styled.div`
  width: 100%;
  max-width: 640px;
  background: ${colors.white};
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: var(--shadow-200);
`

const CardTitle = styled.h2`
  font-size: 20px;
  line-height: 30px;
  font-weight: 700;
  color: ${colors.n900};
  margin: 0 0 4px;
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
  gap: 12px;
`

const SectionLabelEl = styled.p`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${colors.brand};
  margin: 0;
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

const SpanFull = styled.div`
  grid-column: span 2;
`

const Divider = styled.div`
  height: 1px;
  background: ${colors.n100};
`

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FieldLabelEl = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${colors.n400};
  margin: 0;
`

const FieldValue = styled.p`
  font-size: 14px;
  color: ${colors.n800};
  margin: 0;
`

const NavRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 8px;
`

const FlexBtn = styled.div`
  flex: 1;
`

type FieldProps = { label: string; value: string }

function Field({ label, value }: FieldProps) {
  return (
    <FieldWrap>
      <FieldLabelEl>{label}</FieldLabelEl>
      <FieldValue>{value || '—'}</FieldValue>
    </FieldWrap>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <SectionLabelEl>{children}</SectionLabelEl>
}

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)

  if (!c || !id) {
    return (
      <PageWrap style={{ justifyContent: 'center' }}>
        <p style={{ color: colors.n500 }}>케이스를 찾을 수 없습니다.</p>
      </PageWrap>
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
    router.push(`/customer/case/information?id=${id}`)
  }

  return (
    <PageWrap>
      <HeaderWrap>
        <HeaderRow>
          <BackBtn type="button" onClick={() => router.push('/customer/onboarding')}>
            <ArrowLeft size={16} />
            수정하기
          </BackBtn>
          <StepLabel>1차 정보 확인</StepLabel>
        </HeaderRow>
        <ProgressBar />
      </HeaderWrap>

      <Card>
        <div>
          <CardTitle>입력하신 내용을 확인해주세요</CardTitle>
          <CardSubtitle>수정이 필요하시면 '수정하기'로 돌아가 변경할 수 있습니다.</CardSubtitle>
        </div>

        {/* 담당자 정보 */}
        <Section>
          <SectionLabel>담당자 정보</SectionLabel>
          <Grid2>
            <Field label="회사명" value={str('companyName')} />
            <Field label="담당자 이름" value={str('contactName')} />
            <Field label="직함" value={str('contactTitle')} />
            <Field label="연락처" value={str('phone')} />
            <SpanFull>
              <Field label="이메일" value={str('email')} />
            </SpanFull>
          </Grid2>
        </Section>

        <Divider />

        {/* 서비스 */}
        <Section>
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
            <Grid2>
              <Field label="송금 출발 국가" value={getCountryName(str('remittanceFrom'))} />
              <Field
                label="송금 도착 국가"
                value={str('remittanceTo')
                  .split(', ')
                  .filter(Boolean)
                  .map(getCountryName)
                  .join(', ')}
              />
            </Grid2>
          )}
        </Section>

        <Divider />

        {/* 사업자 정보 */}
        <Section>
          <SectionLabel>사업자 정보</SectionLabel>
          <Grid2>
            <Field
              label="사업자 유형"
              value={BUSINESS_TYPE_LABELS[str('businessType')] ?? str('businessType')}
            />
            <Field label="설립 국가" value={getCountryName(str('foundingCountry'))} />
          </Grid2>
        </Section>

        <Divider />

        {/* 거래 규모 */}
        <Section>
          <SectionLabel>거래 규모</SectionLabel>
          <Grid2>
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
          </Grid2>
        </Section>

        {/* 추가 정보 */}
        {(str('referralSource') || str('additionalNote')) && (
          <>
            <Divider />
            <Section>
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
            </Section>
          </>
        )}

        {/* Navigation */}
        <NavRow>
          <FlexBtn>
            <Button variant="outline" onClick={() => router.push('/customer/onboarding')} fullWidth>
              <ArrowLeft size={16} />
              수정하기
            </Button>
          </FlexBtn>
          <FlexBtn>
            <Button onClick={handleConfirm} fullWidth>
              확인하고 계속하기
              <ArrowRight size={16} />
            </Button>
          </FlexBtn>
        </NavRow>
      </Card>
    </PageWrap>
  )
}

export default function CustomerReviewFirstPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  )
}
