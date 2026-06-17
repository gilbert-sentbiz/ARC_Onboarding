import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Envelope, Lock, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useSessionStore } from '../../store/sessionStore'
import { useInternalStaffStore } from '../../store/internalStaffStore'

export default function InternalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)
  const login = useInternalStaffStore((s) => s.login)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    const staff = login(email.trim().toLowerCase(), password)
    if (!staff) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    setSession({
      userId: staff.email,
      role: staff.role,
      name: staff.name,
      email: staff.email,
    })
    navigate('/internal/dashboard')
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
          <div className="flex flex-col gap-1">
            <h2 className="text-[20px] leading-[30px] font-bold text-sb-n900">내부 담당자 로그인</h2>
            <p className="text-[14px] leading-[20px] text-sb-n500">계정 이메일과 비밀번호를 입력하세요</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] p-6 flex flex-col gap-5" style={{ boxShadow: 'var(--shadow-200)' }}>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="이메일"
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              iconLeft={<Envelope size={16} />}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
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
              autoComplete="current-password"
            />

            {error && (
              <p className="text-[13px] text-sb-negative leading-[18px]">{error}</p>
            )}

            <Button type="submit" fullWidth size="lg">
              로그인
              <ArrowRight size={16} weight="bold" />
            </Button>
          </form>

          {/* Demo account hint */}
          <div className="border-t border-sb-n100 pt-4">
            <p className="text-[12px] text-sb-n400 mb-2">데모 계정 (비밀번호: sentbe1234)</p>
            <div className="flex flex-col gap-1">
              {[
                { email: 'sales@sentbe.com', label: '영업' },
                { email: 'compliance@sentbe.com', label: '컴플라이언스' },
                { email: 'ops@sentbe.com', label: '운영' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword('sentbe1234') }}
                  className="text-left text-[12px] text-sb-brand hover:underline"
                >
                  {d.label} — {d.email}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-[13px] text-sb-n400 hover:text-sb-n600 transition-colors text-center"
        >
          ← 고객 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}
