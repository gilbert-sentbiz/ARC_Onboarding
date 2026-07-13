import { useNavigate } from 'react-router-dom'
import { Tray, ClockCounterClockwise, SignOut } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import NotificationBell from '../ui/NotificationBell'

interface Props {
  caseId: string
  active: 'documents' | 'status'
}

export default function TabBar({ caseId, active }: Props) {
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clearSession)
  const session = useSessionStore((s) => s.session)

  function handleLogout() {
    clearSession()
    navigate('/')
  }

  return (
    <div className="w-full bg-white border-b border-sb-n100 sticky top-0 z-10">
      <div className="flex max-w-[640px] mx-auto items-stretch">
        <button
          type="button"
          onClick={() => navigate(`/customer/case/${caseId}/documents`)}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-medium transition-colors border-b-2 ${
            active === 'documents'
              ? 'border-sb-brand text-sb-brand'
              : 'border-transparent text-sb-n500 hover:text-sb-n700'
          }`}
        >
          <Tray size={16} weight={active === 'documents' ? 'fill' : 'regular'} />
          서류 업로드
        </button>
        <button
          type="button"
          onClick={() => navigate(`/customer/case/${caseId}`)}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-medium transition-colors border-b-2 ${
            active === 'status'
              ? 'border-sb-brand text-sb-brand'
              : 'border-transparent text-sb-n500 hover:text-sb-n700'
          }`}
        >
          <ClockCounterClockwise size={16} weight={active === 'status' ? 'fill' : 'regular'} />
          상태 & 이력
        </button>
        <div className="flex items-center px-3 border-b-2 border-transparent gap-1">
          <NotificationBell role="CUSTOMER" userId={session?.userId} />
          <button
            type="button"
            onClick={handleLogout}
            title="로그아웃"
            className="flex items-center justify-center p-1 text-sb-n400 hover:text-sb-n700 transition-colors"
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
