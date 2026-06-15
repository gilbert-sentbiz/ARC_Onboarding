import { useNavigate } from 'react-router-dom'
import { Briefcase, ShieldCheck, Headset } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import type { UserRole } from '../../types'

const ROLES: { role: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    role: 'SALES',
    label: '영업 담당자',
    desc: '케이스 분류 및 인계',
    icon: <Briefcase size={22} weight="fill" />,
  },
  {
    role: 'COMPLIANCE',
    label: '컴플라이언스 담당자',
    desc: '서류 검토 및 승인/드롭',
    icon: <ShieldCheck size={22} weight="fill" />,
  },
  {
    role: 'OPS',
    label: '운영 담당자',
    desc: '승인 케이스 확인 및 계정 안내',
    icon: <Headset size={22} weight="fill" />,
  },
]

export default function InternalLoginPage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)

  function selectRole(role: UserRole, label: string) {
    setSession({ userId: `${role}_demo`, role, name: label, email: `${role.toLowerCase()}@sentbe.com` })
    navigate('/internal/dashboard')
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-7 w-auto" />
          <div className="flex flex-col gap-1">
            <h2 className="text-[20px] leading-[30px] font-bold text-sb-n900">내부 담당자 접속</h2>
            <p className="text-[14px] leading-[20px] text-sb-n500">역할을 선택하세요</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {ROLES.map(({ role, label, desc, icon }) => (
            <button
              key={role}
              onClick={() => selectRole(role, label)}
              className="flex items-center gap-4 bg-white border border-sb-n200 rounded-[12px] px-5 py-4 text-left hover:border-sb-brand hover:shadow-sb-100 transition-all duration-[120ms] group"
            >
              <div className="w-10 h-10 rounded-[8px] bg-sb-blue-100 flex items-center justify-center text-sb-brand group-hover:bg-sb-brand group-hover:text-white transition-colors duration-[120ms] flex-shrink-0">
                {icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[14px] font-semibold text-sb-n800 leading-[20px]">{label}</p>
                <p className="text-[12px] text-sb-n500 leading-[18px]">{desc}</p>
              </div>
            </button>
          ))}
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
