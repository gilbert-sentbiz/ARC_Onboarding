import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Envelope, CheckCircle, FileText, Buildings, ArrowsLeftRight } from '@phosphor-icons/react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useSessionStore } from '../../store/sessionStore'
import { useCaseStore } from '../../store/caseStore'

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
  const [emailError, setEmailError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [agreedError, setAgreedError] = useState(false)
  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)
  const findByEmail = useCaseStore((s) => s.findByEmail)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let valid = true

    if (!EMAIL_RE.test(email)) {
      setEmailError('올바른 이메일 주소를 입력해주세요.')
      valid = false
    } else {
      setEmailError('')
    }

    if (!agreed) {
      setAgreedError(true)
      valid = false
    } else {
      setAgreedError(false)
    }

    if (!valid) return

    setSession({ userId: email, role: 'CUSTOMER', name: '', email })

    const existing = findByEmail(email)
    if (existing) {
      navigate(`/customer/case/${existing.id}`)
    } else {
      navigate('/customer/onboarding')
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
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img
            src="/ARC_Onboarding/logos/wordmark-navy.svg"
            alt="SentBiz"
            className="h-7 w-auto"
          />
        </div>

        <div className="w-full max-w-[440px]">
          <div
            className="bg-white rounded-[16px] p-8 flex flex-col gap-8"
            style={{ boxShadow: 'var(--shadow-200)' }}
          >
            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[22px] leading-[34px] font-bold text-sb-n900">
                온보딩 시작하기
              </h2>
              <p className="text-[14px] leading-[20px] text-sb-n500">
                이메일 주소로 진행 중인 케이스를 확인하거나 새 온보딩을 시작합니다.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <Input
                label="이메일 주소"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                error={emailError}
                iconLeft={<Envelope size={16} />}
                autoComplete="email"
                autoFocus
              />

              {/* Agreement */}
              <label
                className={`flex items-start gap-3 cursor-pointer group`}
                onClick={() => {
                  setAgreed((v) => !v)
                  setAgreedError(false)
                }}
              >
                <div
                  className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms] ${
                    agreed
                      ? 'bg-sb-brand border-sb-brand'
                      : agreedError
                      ? 'border-sb-negative bg-sb-negative-light'
                      : 'border-sb-n300 bg-white group-hover:border-sb-brand'
                  }`}
                >
                  {agreed && <CheckCircle size={12} weight="fill" className="text-white" />}
                </div>
                <span className={`text-[13px] leading-[20px] ${agreedError ? 'text-sb-negative' : 'text-sb-n600'}`}>
                  <span className="font-medium">개인정보 수집 및 이용</span>에 동의합니다.{' '}
                  {agreedError && <span className="text-sb-negative">(필수)</span>}
                </span>
              </label>

              <Button type="submit" fullWidth size="lg">
                시작하기
                <ArrowRight size={16} weight="bold" />
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-sb-n100" />
              <span className="text-[12px] text-sb-n400">또는</span>
              <div className="flex-1 h-px bg-sb-n100" />
            </div>

            {/* Internal access */}
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
            <a
              href="mailto:support@sentbe.com"
              className="text-sb-brand hover:underline"
            >
              support@sentbe.com
            </a>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
