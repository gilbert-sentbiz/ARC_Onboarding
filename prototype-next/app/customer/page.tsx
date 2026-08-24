'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Envelope, LockKey, CheckCircle, FileText, Buildings, ArrowsLeftRight } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useSessionStore } from '@/store/sessionStore'
import { requestOtp, verifyOtp } from '@/services/api/auth'
import { ApiError } from '@/services/apiClient'

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

export default function LandingPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; code?: string; agreed?: string }>({})
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const setSession = useSessionStore((s) => s.setSession)
  // 로컬 데모(백엔드 localhost)에서만 만능코드 힌트 노출 — 실 배포에는 표시 안 됨
  const isLocalDemo = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').includes('localhost')

  // 이메일 단계: 동의 확인 후 OTP 코드 발송 (C11)
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email)) next.email = '올바른 이메일 주소를 입력해주세요.'
    if (!agreed) next.agreed = '개인정보 수집 및 이용에 동의해주세요.'
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await requestOtp({ email: email.trim().toLowerCase() })
      setStep('code')
    } catch (err) {
      const msg = err instanceof ApiError ? '인증코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' : '서버에 연결할 수 없습니다.'
      setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  // 코드 단계: OTP 검증 → 세션 토큰 저장 → 온보딩 시작 (C12)
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      setErrors({ code: '인증코드를 입력해주세요.' })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await verifyOtp({ email: email.trim().toLowerCase(), code: code.trim() })
      setSession({ userId: email.trim().toLowerCase(), role: 'CUSTOMER', name: '', email: email.trim().toLowerCase() }, res.token)
      router.push('/customer/onboarding')
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 401 ? '인증코드가 올바르지 않거나 만료되었습니다.' : '인증에 실패했습니다. 다시 시도해주세요.'
      setErrors({ code: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 px-12 py-12"
        style={{ background: 'var(--sb-n900)' }}
      >
        <img
          src="/ARK_Onboarding/logos/wordmark-white.svg"
          alt="SentBiz"
          className="h-7 w-auto object-left object-contain"
        />

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span
              className="text-[12px] font-semibold tracking-[1.5px] uppercase"
              style={{ color: 'var(--sb-n400)' }}
            >
              기업 서비스
            </span>
            <h1 className="text-[32px] leading-[40px] font-extrabold text-white">
              빠르고 투명한<br />온보딩 절차
            </h1>
            <p className="text-[15px] leading-[24px]" style={{ color: 'var(--sb-n400)' }}>
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
                  <p className="text-[13px] leading-[20px]" style={{ color: 'var(--sb-n400)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] leading-[18px]" style={{ color: 'var(--sb-n500)' }}>
          © 2025 SENTBE Inc. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'var(--sb-n50)' }}
      >
        <div className="lg:hidden mb-10">
          <img src="/ARK_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
        </div>

        <div className="w-full max-w-[440px]">
          <div
            className="bg-white rounded-[16px] p-8 flex flex-col gap-8"
            style={{ boxShadow: 'var(--shadow-200)' }}
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[22px] leading-[34px] font-bold" style={{ color: 'var(--sb-n900)' }}>
                {step === 'email' ? '온보딩 시작하기' : '인증코드 입력'}
              </h2>
              <p className="text-[14px] leading-[20px]" style={{ color: 'var(--sb-n500)' }}>
                {step === 'email'
                  ? '이메일로 인증코드를 보내드립니다.'
                  : `${email} 로 보낸 인증코드를 입력해주세요.`}
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleRequestCode} noValidate className="flex flex-col gap-5">
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

                <div>
                  <label
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => {
                      setAgreed((v) => !v)
                      setErrors((prev) => ({ ...prev, agreed: undefined }))
                    }}
                  >
                    <div
                      className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms]"
                      style={
                        agreed
                          ? { background: 'var(--sb-brand)', borderColor: 'var(--sb-brand)' }
                          : errors.agreed
                          ? { borderColor: 'var(--sb-negative)', background: 'var(--sb-negative-light)' }
                          : { borderColor: 'var(--sb-n300)', background: 'white' }
                      }
                    >
                      {agreed && <CheckCircle size={12} weight="fill" className="text-white" />}
                    </div>
                    <span
                      className="text-[13px] leading-[20px]"
                      style={{ color: errors.agreed ? 'var(--sb-negative)' : 'var(--sb-n600)' }}
                    >
                      <span className="font-medium">개인정보 수집 및 이용</span>에 동의합니다.
                    </span>
                  </label>
                  {errors.agreed && (
                    <p className="mt-1.5 text-[11px] leading-[16px]" style={{ color: 'var(--sb-negative)' }}>{errors.agreed}</p>
                  )}
                </div>

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? '발송 중…' : '인증코드 받기'}
                  {!loading && <ArrowRight size={16} weight="bold" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} noValidate className="flex flex-col gap-5">
                <Input
                  label="인증코드"
                  type="text"
                  inputMode="numeric"
                  placeholder="6자리 코드"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setErrors((prev) => ({ ...prev, code: undefined }))
                  }}
                  error={errors.code}
                  iconLeft={<LockKey size={16} />}
                  autoFocus
                />

                {isLocalDemo && (
                  <p className="text-[12px] -mt-2" style={{ color: 'var(--sb-n400)' }}>
                    로컬 데모: 인증코드 <span className="font-mono font-medium" style={{ color: 'var(--sb-brand)' }}>000000</span> 입력
                  </p>
                )}

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? '확인 중…' : '확인'}
                  {!loading && <ArrowRight size={16} weight="bold" />}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setErrors({}) }}
                  className="text-[13px] transition-colors text-center"
                  style={{ color: 'var(--sb-n500)' }}
                >
                  ← 이메일 다시 입력
                </button>
              </form>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--sb-n100)' }} />
              <span className="text-[12px]" style={{ color: 'var(--sb-n400)' }}>또는</span>
              <div className="flex-1 h-px" style={{ background: 'var(--sb-n100)' }} />
            </div>

            <button
              type="button"
              onClick={() => router.push('/internal')}
              className="text-[13px] transition-colors duration-[120ms] text-center leading-[20px]"
              style={{ color: 'var(--sb-n500)' }}
            >
              내부 담당자로 접속하기
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] leading-[18px]" style={{ color: 'var(--sb-n400)' }}>
            도움이 필요하시면{' '}
            <a href="mailto:support@sentbe.com" className="hover:underline" style={{ color: 'var(--sb-brand)' }}>
              support@sentbe.com
            </a>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
