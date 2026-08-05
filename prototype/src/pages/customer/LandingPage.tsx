import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Envelope, Lock, Eye, EyeSlash, CheckCircle, FileText, Buildings, ArrowsLeftRight } from '@phosphor-icons/react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useSessionStore } from '../../store/sessionStore'
import { useCaseStore } from '../../store/caseStore'
import { useIntakeResponseStore } from '../../store/intakeResponseStore'
import { useAccountStore } from '../../store/accountStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FEATURES = [
  {
    icon: <Buildings size={20} weight="fill" />,
    title: '기업 유형별 맞춤 안내',
    desc: '법인·개인사업자·금융업 유형에 따라 필요한 서류를 자동으로 안내합니다.',
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

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; agreed?: string }>({})

  const navigate = useNavigate()
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

    const intakeStore = useIntakeResponseStore.getState()
    const firstIntake = existing ? intakeStore.getByCase(existing.id, 'first') : null
    const secondIntake = existing ? intakeStore.getByCase(existing.id, 'second') : null

    if (!existing || firstIntake?.status !== 'submitted') {
      // No case, or 1차 form not yet confirmed → 1차 입력 (pre-fills draft if any)
      navigate('/customer/onboarding')
    } else if (!secondIntake || secondIntake.status === 'not_started') {
      // 1차 confirmed, 2차 not started → 2차 입력
      navigate(`/customer/case/${existing.id}/information`)
    } else if (secondIntake.status === 'draft') {
      // 2차 draft saved → continue 2차 입력 (not review)
      navigate(`/customer/case/${existing.id}/information`)
    } else {
      // 2차 confirmed (submitted) → route by case status
      const s = existing.status
      if (s === 'DOCUMENT_SUBMISSION_REQUIRED' || s === 'REVISION_REQUESTED') {
        navigate(`/customer/case/${existing.id}/documents`)
      } else {
        navigate(`/customer/case/${existing.id}`)
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-sb-n900 px-12 py-12">
        <img
          src="/ARC_Onboarding/logos/wordmark-white.svg"
          alt="SentBiz"
          className="h-7 w-auto object-left object-contain"
        />

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="text-[12px] font-semibold tracking-[1.5px] uppercase text-sb-n400">
              기업 서비스
            </span>
            <h1 className="text-[32px] leading-[40px] font-extrabold text-white">
              빠르고 투명한<br />온보딩 절차
            </h1>
            <p className="text-[15px] leading-[24px] text-sb-n400">
              센트비 기업 서비스 이용을 위한 온보딩을
              <br />
              온라인으로 간편하게 진행하세요.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-[8px] bg-white/10 flex items-center justify-center text-white">
                  {f.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] font-semibold text-white leading-[20px]">{f.title}</p>
                  <p className="text-[13px] leading-[20px] text-sb-n400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-sb-n500 leading-[18px]">
          © 2025 SENTBE Inc. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-sb-n50">
        <div className="lg:hidden mb-10">
          <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
        </div>

        <div className="w-full max-w-[440px]">
          <div
            className="bg-white rounded-[16px] p-8 flex flex-col gap-8"
            style={{ boxShadow: 'var(--shadow-200)' }}
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[22px] leading-[34px] font-bold text-sb-n900">
                {isReturning ? '다시 오셨군요' : '온보딩 시작하기'}
              </h2>
              <p className="text-[14px] leading-[20px] text-sb-n500">
                {isReturning
                  ? '비밀번호를 입력해 진행 중인 케이스를 이어가세요.'
                  : '이메일과 비밀번호를 입력하면 온보딩을 시작합니다.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="flex items-center text-sb-n400 hover:text-sb-n600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                }
                autoComplete={isReturning ? 'current-password' : 'new-password'}
              />

              {/* Agreement — 신규 가입 시만 */}
              {!isReturning && (
                <div>
                  <label
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => {
                      setAgreed((v) => !v)
                      setErrors((prev) => ({ ...prev, agreed: undefined }))
                    }}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms] ${
                        agreed
                          ? 'bg-sb-brand border-sb-brand'
                          : errors.agreed
                          ? 'border-sb-negative bg-sb-negative-light'
                          : 'border-sb-n300 bg-white group-hover:border-sb-brand'
                      }`}
                    >
                      {agreed && <CheckCircle size={12} weight="fill" className="text-white" />}
                    </div>
                    <span className={`text-[13px] leading-[20px] ${errors.agreed ? 'text-sb-negative' : 'text-sb-n600'}`}>
                      <span className="font-medium">개인정보 수집 및 이용</span>에 동의합니다.
                    </span>
                  </label>
                  {errors.agreed && (
                    <p className="mt-1.5 text-[11px] leading-[16px] text-sb-negative">{errors.agreed}</p>
                  )}
                </div>
              )}

              <Button type="submit" fullWidth size="lg">
                {isReturning ? '계속하기' : '시작하기'}
                <ArrowRight size={16} weight="bold" />
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-sb-n100" />
              <span className="text-[12px] text-sb-n400">또는</span>
              <div className="flex-1 h-px bg-sb-n100" />
            </div>

            <button
              type="button"
              onClick={() => navigate('/internal')}
              className="text-[13px] text-sb-n500 hover:text-sb-n700 transition-colors duration-[120ms] text-center leading-[20px]"
            >
              내부 담당자로 접속하기
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] leading-[18px] text-sb-n400">
            도움이 필요하시면{' '}
            <a href="mailto:support@sentbe.com" className="text-sb-brand hover:underline">
              support@sentbe.com
            </a>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
