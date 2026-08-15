import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Envelope, FileText, Buildings, ArrowsLeftRight } from '@phosphor-icons/react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useSessionStore } from '../../store/sessionStore'
import * as api from '../../services/arcApi'

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
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { setSession, activeCaseId } = useSessionStore()

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!EMAIL_RE.test(email)) { setError('올바른 이메일 주소를 입력해주세요.'); return }
    setLoading(true)
    try {
      await api.requestOtp(email)
      setStep('otp')
    } catch {
      setError('OTP 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) { setError('OTP 코드를 입력해주세요.'); return }
    setLoading(true)
    try {
      const { token } = await api.verifyOtp(email, otp.trim())
      setSession({ userId: email, role: 'CUSTOMER', name: '', email }, token)

      // Route based on active case if we have one
      if (activeCaseId) {
        try {
          const c = await api.getCase(activeCaseId)
          const s = c.status
          if (s === 'DOCUMENT_SUBMISSION_REQUIRED' || s === 'REVISION_REQUESTED') {
            navigate(`/customer/case/${activeCaseId}/documents`)
          } else if (s === 'INQUIRY_RECEIVED' || s === 'DOCUMENT_SCREENING_REQUIRED') {
            navigate(`/customer/case/${activeCaseId}`)
          } else {
            navigate(`/customer/case/${activeCaseId}`)
          }
          return
        } catch {
          // Case not found or error → start fresh
        }
      }
      navigate('/customer/onboarding')
    } catch {
      setError('OTP 코드가 올바르지 않거나 만료되었습니다.')
    } finally {
      setLoading(false)
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
                {step === 'email' ? '온보딩 시작하기' : '이메일 인증'}
              </h2>
              <p className="text-[14px] leading-[20px] text-sb-n500">
                {step === 'email'
                  ? '이메일 주소를 입력하면 인증 코드를 보내드립니다.'
                  : `${email}로 발송된 6자리 코드를 입력하세요.`}
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} noValidate className="flex flex-col gap-5">
                <Input
                  label="이메일 주소"
                  type="email"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  error={error}
                  iconLeft={<Envelope size={16} />}
                  autoComplete="email"
                  autoFocus
                />
                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? '발송 중...' : '인증 코드 받기'}
                  {!loading && <ArrowRight size={16} weight="bold" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-5">
                <Input
                  label="인증 코드"
                  type="text"
                  placeholder="6자리 숫자 입력"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setError('') }}
                  error={error}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? '확인 중...' : '확인'}
                  {!loading && <ArrowRight size={16} weight="bold" />}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                  className="text-[13px] text-sb-n500 hover:text-sb-n700 transition-colors text-center"
                >
                  이메일 다시 입력
                </button>
              </form>
            )}

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
