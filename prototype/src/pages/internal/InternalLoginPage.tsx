import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Envelope, ArrowRight } from '@phosphor-icons/react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useSessionStore } from '../../store/sessionStore'
import * as api from '../../services/arcApi'

const ROLE_MAP: Record<string, 'SALES' | 'COMPLIANCE' | 'OPS'> = {
  'sales@sentbe.com': 'SALES',
  'compliance@sentbe.com': 'COMPLIANCE',
  'ops@sentbe.com': 'OPS',
  'admin@sentbe.com': 'SALES',
}
const NAME_MAP: Record<string, string> = {
  'sales@sentbe.com': '영업 테스트',
  'compliance@sentbe.com': '컴플라이언스 테스트',
  'ops@sentbe.com': '운영 테스트',
  'admin@sentbe.com': '관리자 테스트',
}

export default function InternalLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { setStaffSession } = useSessionStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    setLoading(true)
    try {
      const { token } = await api.mockLogin(email.trim().toLowerCase())
      const role = ROLE_MAP[email.trim().toLowerCase()] ?? 'SALES'
      const name = NAME_MAP[email.trim().toLowerCase()] ?? email
      setStaffSession({ userId: email, role, name, email: email.trim().toLowerCase() }, token)
      navigate('/internal/dashboard')
    } catch {
      setError('등록되지 않은 이메일이거나 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
          <div className="flex flex-col gap-1">
            <h2 className="text-[20px] leading-[30px] font-bold text-sb-n900">내부 담당자 로그인</h2>
            <p className="text-[14px] leading-[20px] text-sb-n500">계정 이메일을 입력하세요 (로컬 환경)</p>
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

            {error && (
              <p className="text-[13px] text-sb-negative leading-[18px]">{error}</p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </Button>
          </form>

          <div className="border-t border-sb-n100 pt-4">
            <p className="text-[12px] text-sb-n400 mb-2">테스트 계정</p>
            <div className="flex flex-col gap-1">
              {[
                { email: 'sales@sentbe.com', label: '영업' },
                { email: 'compliance@sentbe.com', label: '컴플라이언스' },
                { email: 'ops@sentbe.com', label: '운영' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => setEmail(d.email)}
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
