'use client'

import styled from '@emotion/styled'
import {
  ArrowRight,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  CheckCircle,
  FileText,
  Buildings,
  ArrowsLeftRight,
} from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { useAccountStore } from '@/src/entities/customer/model/accountStore'
import { colors } from '@/src/shared/const/tokens'
import Button from '@/src/shared/ui/Button'
import Input from '@/src/shared/ui/Input'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FEATURES = [
  {
    icon: <Buildings size={20} weight="fill" />,
    title: '기업 유형별 맞춤 안내',
    desc: '법인·개인사업자·금융기관 유형에 따라 필요한 서류를 자동으로 안내합니다.',
  },
  {
    icon: <FileText size={20} weight="fill" />,
    title: '서류 제출 및 진행 현황',
    desc: '제출 내역과 검토 상태를 실시간으로 확인할 수 있습니다.',
  },
  {
    icon: <ArrowsLeftRight size={20} weight="fill" />,
    title: '담당자와 1:1 소통',
    desc: '온보딩 전 과정에서 담당자와 직접 메시지를 주고받을 수 있습니다.',
  },
]

const Page = styled.div`
  min-height: 100vh;
  display: flex;
`

const LeftPanel = styled.div`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 480px;
  flex-shrink: 0;
  padding: 48px;
  background: ${colors.n900};
  @media (min-width: 1024px) {
    display: flex;
  }
`

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`

const FeatureIcon = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.white};
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: ${colors.n50};
`

const MobileLogo = styled.div`
  margin-bottom: 40px;
  @media (min-width: 1024px) {
    display: none;
  }
`

const FormOuter = styled.div`
  width: 100%;
  max-width: 440px;
`

const Card = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  box-shadow: var(--shadow-200);
`

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const FormWrap = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const EyeToggle = styled.button`
  display: flex;
  align-items: center;
  color: ${colors.n400};
  transition: color 120ms;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`

const AgreementRow = styled.div``

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
  color: ${colors.white};
  background: ${({ checked, hasError }) =>
    checked ? colors.brand : hasError ? colors.negativeLight : colors.white};
  border-color: ${({ checked, hasError }) =>
    checked ? colors.brand : hasError ? colors.negative : colors.n300};
`

const AgreementText = styled.span<{ hasError: boolean }>`
  font-size: 13px;
  line-height: 20px;
  color: ${({ hasError }) => (hasError ? colors.negative : colors.n600)};
`

const AgreementError = styled.p`
  margin-top: 6px;
  font-size: 11px;
  line-height: 16px;
  color: ${colors.negative};
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${colors.n100};
`

const InternalLink = styled.button`
  width: 100%;
  font-size: 13px;
  line-height: 20px;
  text-align: center;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const SupportText = styled.p`
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  color: ${colors.n400};
`

const SupportLink = styled.a`
  color: ${colors.brand};
  &:hover {
    text-decoration: underline;
  }
`

export default function CustomerStartPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; agreed?: string }>({})

  const router = useRouter()
  const setSession = useSessionStore((s) => s.setSession)
  const findByEmail = useCaseStore((s) => s.findByEmail)
  const { exists, verify, register } = useAccountStore()

  const isReturning = EMAIL_RE.test(email) && exists(email)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const next: typeof errors = {}

    if (!EMAIL_RE.test(email)) next.email = '올바른 이메일 주소를 입력해주세요.'
    if (!password) next.password = '비밀번호를 입력해주세요.'

    if (Object.keys(next).length === 0 && isReturning) {
      if (!verify(email, password)) {
        next.password = '비밀번호가 올바르지 않습니다.'
      }
    }

    if (Object.keys(next).length === 0 && !isReturning && !agreed) {
      next.agreed = '개인정보 수집 및 이용에 동의해주세요.'
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    if (!isReturning) register(email, password)

    setSession({ userId: email, role: 'CUSTOMER', name: '', email })

    const existing = findByEmail(email)

    if (!existing || existing.firstIntake?.status !== 'submitted') {
      router.push('/customer/onboarding')
    } else if (!existing.secondIntake || existing.secondIntake.status === 'not_started') {
      router.push(`/customer/case/information?id=${existing.id}`)
    } else if (existing.secondIntake.status === 'draft') {
      router.push(`/customer/case/information?id=${existing.id}`)
    } else {
      const s = existing.status
      if (s === 'DOCUMENT_SUBMISSION_REQUIRED' || s === 'REVISION_REQUESTED') {
        router.push(`/customer/case/documents?id=${existing.id}`)
      } else {
        router.push(`/customer/case?id=${existing.id}`)
      }
    }
  }

  return (
    <Page>
      {/* ── Left: Brand panel ── */}
      <LeftPanel>
        <img
          src="/ARK_Onboarding/logos/wordmark-white.svg"
          alt="SentBiz"
          style={{ height: 28, width: 'auto', objectFit: 'contain', objectPosition: 'left' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: colors.n400,
              }}
            >
              기업 서비스
            </span>
            <h1
              style={{
                fontSize: 32,
                lineHeight: '40px',
                fontWeight: 800,
                color: colors.white,
                margin: 0,
              }}
            >
              빠르고 투명한
              <br />
              온보딩 절차
            </h1>
            <p style={{ fontSize: 15, lineHeight: '24px', color: colors.n400, margin: 0 }}>
              센트비 기업 서비스 이용을 위한 온보딩을
              <br />
              온라인으로 간편하게 진행하세요.
            </p>
          </div>

          <FeatureList>
            {FEATURES.map((f) => (
              <FeatureItem key={f.title}>
                <FeatureIcon>{f.icon}</FeatureIcon>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: colors.white,
                      lineHeight: '20px',
                      margin: 0,
                    }}
                  >
                    {f.title}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: '20px', color: colors.n400, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </FeatureItem>
            ))}
          </FeatureList>
        </div>

        <p style={{ fontSize: 12, lineHeight: '18px', color: colors.n500, margin: 0 }}>
          © 2025 SENTBE Inc. All rights reserved.
        </p>
      </LeftPanel>

      {/* ── Right: Form panel ── */}
      <RightPanel>
        <MobileLogo>
          <img
            src="/ARK_Onboarding/logos/wordmark-navy.svg"
            alt="SentBiz"
            style={{ height: 28, width: 'auto' }}
          />
        </MobileLogo>

        <FormOuter>
          <Card>
            <CardHeader>
              <h2
                style={{
                  fontSize: 22,
                  lineHeight: '34px',
                  fontWeight: 700,
                  color: colors.n900,
                  margin: 0,
                }}
              >
                {isReturning ? '다시 오셨군요' : '온보딩 시작하기'}
              </h2>
              <p style={{ fontSize: 14, lineHeight: '20px', color: colors.n500, margin: 0 }}>
                {isReturning
                  ? '비밀번호를 입력해 진행 중인 케이스를 이어가세요.'
                  : '이메일과 비밀번호를 입력하면 온보딩을 시작합니다.'}
              </p>
            </CardHeader>

            <FormWrap onSubmit={handleSubmit} noValidate>
              <Input
                label="이메일 주소"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                error={errors.email}
                iconLeft={<Envelope size={16} />}
                autoComplete="email"
                autoFocus
              />

              <Input
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                placeholder={isReturning ? '비밀번호 입력' : '사용할 비밀번호 설정'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                error={errors.password}
                iconLeft={<Lock size={16} />}
                iconRight={
                  <EyeToggle type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </EyeToggle>
                }
                autoComplete={isReturning ? 'current-password' : 'new-password'}
              />

              {!isReturning && (
                <AgreementRow>
                  <CheckboxLabel
                    onClick={() => {
                      setAgreed((v) => !v)
                      setErrors((prev) => ({ ...prev, agreed: undefined }))
                    }}
                  >
                    <CheckboxBox checked={agreed} hasError={!!errors.agreed}>
                      {agreed && <CheckCircle size={12} weight="fill" />}
                    </CheckboxBox>
                    <AgreementText hasError={!!errors.agreed}>
                      <strong>개인정보 수집 및 이용</strong>에 동의합니다.
                    </AgreementText>
                  </CheckboxLabel>
                  {errors.agreed && <AgreementError>{errors.agreed}</AgreementError>}
                </AgreementRow>
              )}

              <Button type="submit" fullWidth size="lg">
                {isReturning ? '계속하기' : '시작하기'}
                <ArrowRight size={16} weight="bold" />
              </Button>
            </FormWrap>

            <Divider>
              <DividerLine />
              <span style={{ fontSize: 12, color: colors.n400 }}>또는</span>
              <DividerLine />
            </Divider>

            <InternalLink type="button" onClick={() => router.push('/internal')}>
              내부 담당자로 접속하기
            </InternalLink>
          </Card>

          <SupportText>
            도움이 필요하시면{' '}
            <SupportLink href="mailto:support@sentbe.com">support@sentbe.com</SupportLink>
            으로 문의해 주세요.
          </SupportText>
        </FormOuter>
      </RightPanel>
    </Page>
  )
}
