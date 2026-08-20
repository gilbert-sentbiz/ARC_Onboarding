'use client'

import { Envelope, Lock, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useInternalStaffStore } from '@/src/entities/staff/model/internalStaffStore'
import Button from '@/src/shared/ui/Button'
import Input from '@/src/shared/ui/Input'

export default function InternalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
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
    router.push('/internal/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--sb-n50)' }}
    >
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
          <div className="flex flex-col gap-1">
            <h2
              className="text-[20px] leading-[30px] font-bold"
              style={{ color: 'var(--sb-n900)' }}
            >
              내부 담당자 로그인
            </h2>
            <p className="text-[14px] leading-[20px]" style={{ color: 'var(--sb-n500)' }}>
              계정 이메일과 비밀번호를 입력하세요
            </p>
          </div>
        </div>

        <div
          className="bg-white rounded-[16px] p-6 flex flex-col gap-5"
          style={{ boxShadow: 'var(--shadow-200)' }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="이메일"
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              iconLeft={<Envelope size={16} />}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              iconLeft={<Lock size={16} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex items-center transition-colors"
                  style={{ color: 'var(--sb-n400)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
            />

            {error && (
              <p className="text-[13px] leading-[18px]" style={{ color: 'var(--sb-negative)' }}>
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg">
              로그인
              <ArrowRight size={16} weight="bold" />
            </Button>
          </form>

          {/* Demo account hint */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--sb-n100)' }}>
            <p className="text-[12px] mb-2" style={{ color: 'var(--sb-n400)' }}>
              데모 계정 (비밀번호: sentbe1234)
            </p>
            <div className="flex flex-col gap-1">
              {[
                { email: 'sales@sentbe.com', label: '영업' },
                { email: 'compliance@sentbe.com', label: '컴플라이언스' },
                { email: 'ops@sentbe.com', label: '운영' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email)
                    setPassword('sentbe1234')
                  }}
                  className="text-left text-[12px] hover:underline"
                  style={{ color: 'var(--sb-brand)' }}
                >
                  {d.label} — {d.email}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-[13px] transition-colors text-center"
          style={{ color: 'var(--sb-n400)' }}
        >
          ← 고객 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}
