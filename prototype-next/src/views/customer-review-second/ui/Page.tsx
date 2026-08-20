'use client'
import styled from '@emotion/styled'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { getRuleSet } from '@/src/entities/rule/model/ruleStore'
import { confirmSecondIntake } from '@/src/features/case-actions/api/caseService'
import { colors } from '@/src/shared/const/tokens'
import type { QuestionRule } from '@/src/shared/type'
import Button from '@/src/shared/ui/Button'
import { getCountryName } from '@/src/shared/util/countryNames'

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

function renderValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? '예' : '아니오'
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—'
  return String(val)
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

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${colors.n200};
  background: ${colors.n50};
`

const InfoBlockTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.n700};
  margin: 0;
`

const InnerSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const InnerDivider = styled.div`
  height: 1px;
  background: ${colors.n200};
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
  word-break: break-word;
  color: ${colors.n800};
  margin: 0;
`

const EmptyText = styled.p`
  font-size: 13px;
  color: ${colors.n400};
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

type DataBlockProps = { data: Record<string, unknown>; labelMap: Record<string, string> }

function DataBlock({ data, labelMap }: DataBlockProps) {
  const entries = Object.entries(data).filter(([key, v]) => {
    if (v === null || v === undefined || v === '' || v === false) return false
    if (Array.isArray(v) && v.length === 0) return false
    if (getLabel(key, labelMap) === key) return false
    return true
  })
  if (entries.length === 0) return <EmptyText>입력된 정보가 없습니다.</EmptyText>
  return (
    <Grid2>
      {entries.map(([key, val]) => (
        <Field key={key} label={getLabel(key, labelMap)} value={renderValue(val)} />
      ))}
    </Grid2>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  if (!c || !id) {
    return (
      <PageWrap style={{ justifyContent: 'center' }}>
        <p style={{ color: colors.n500 }}>케이스를 찾을 수 없습니다.</p>
      </PageWrap>
    )
  }

  const d1 = c.firstIntake.data as Record<string, unknown>
  const str1 = (key: string) => String(d1[key] ?? '')
  const services = (d1.services as string[]) ?? []
  const collectionCountries = (d1.collectionCountries as string[]) ?? []

  const labelMap = buildLabelMap()

  const d2 = c.secondIntake.data as {
    entity?: Record<string, unknown>
    krwCollection?: Record<string, unknown>
    vndCollection?: Record<string, unknown>
  }

  function handleConfirm() {
    if (!id) return
    const result = confirmSecondIntake(id, session?.name || session?.email || '고객')
    if (result.ok) {
      router.push(`/customer/case/documents?id=${id}`)
    }
  }

  return (
    <PageWrap>
      <HeaderWrap>
        <HeaderRow>
          <BackBtn type="button" onClick={() => router.push(`/customer/case/information?id=${id}`)}>
            <ArrowLeft size={16} />
            수정하기
          </BackBtn>
          <StepLabel>2차 정보 확인</StepLabel>
        </HeaderRow>
        <ProgressBar />
      </HeaderWrap>

      <Card>
        <div>
          <CardTitle>전체 입력 내용을 확인해주세요</CardTitle>
          <CardSubtitle>제출 후에는 수정이 어렵습니다. 내용을 꼼꼼히 확인해주세요.</CardSubtitle>
        </div>

        {/* ── 1차 정보 ── */}
        <InfoBlock>
          <InfoBlockTitle>1차 정보</InfoBlockTitle>

          <InnerSections>
            <Section>
              <SectionLabel>담당자 정보</SectionLabel>
              <Grid2>
                <Field label="회사명" value={str1('companyName')} />
                <Field label="담당자 이름" value={str1('contactName')} />
                <Field label="직함" value={str1('contactTitle')} />
                <Field label="연락처" value={str1('phone')} />
              </Grid2>
            </Section>

            <InnerDivider />

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
                    .map((cc) =>
                      cc === 'OTHER' ? str1('collectionOtherCountry') || '기타' : getCountryName(cc)
                    )
                    .join(', ')}
                />
              )}
              {services.includes('remittance') && (
                <Grid2>
                  <Field label="송금 출발 국가" value={getCountryName(str1('remittanceFrom'))} />
                  <Field
                    label="송금 도착 국가"
                    value={str1('remittanceTo').split(', ').map(getCountryName).join(', ')}
                  />
                </Grid2>
              )}
            </Section>

            <InnerDivider />

            <Section>
              <SectionLabel>사업자 정보</SectionLabel>
              <Grid2>
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
              </Grid2>
            </Section>

            {str1('additionalNote') && (
              <>
                <InnerDivider />
                <Field label="추가 문의사항" value={str1('additionalNote')} />
              </>
            )}
          </InnerSections>
        </InfoBlock>

        {/* ── 2차 정보 ── */}
        <InfoBlock>
          <InfoBlockTitle>2차 정보</InfoBlockTitle>

          {d2.entity && (
            <Section>
              <SectionLabel>기업 정보</SectionLabel>
              <DataBlock data={d2.entity} labelMap={labelMap} />
            </Section>
          )}

          {d2.krwCollection && (
            <>
              <InnerDivider />
              <Section>
                <SectionLabel>KRW 수금 정보</SectionLabel>
                <DataBlock data={d2.krwCollection} labelMap={labelMap} />
              </Section>
            </>
          )}

          {d2.vndCollection && (
            <>
              <InnerDivider />
              <Section>
                <SectionLabel>VND 수금 정보</SectionLabel>
                <DataBlock data={d2.vndCollection} labelMap={labelMap} />
              </Section>
            </>
          )}

          {!d2.entity && !d2.krwCollection && !d2.vndCollection && (
            <EmptyText>입력된 2차 정보가 없습니다.</EmptyText>
          )}
        </InfoBlock>

        {/* Navigation */}
        <NavRow>
          <FlexBtn>
            <Button
              variant="outline"
              onClick={() => router.push(`/customer/case/information?id=${id}`)}
              fullWidth
            >
              <ArrowLeft size={16} />
              수정하기
            </Button>
          </FlexBtn>
          <FlexBtn>
            <Button onClick={handleConfirm} fullWidth>
              제출하기
              <ArrowRight size={16} />
            </Button>
          </FlexBtn>
        </NavRow>
      </Card>
    </PageWrap>
  )
}

export default function CustomerReviewSecondPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  )
}
