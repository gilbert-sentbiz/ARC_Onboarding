'use client'

import { Tray, ClockCounterClockwise, SignOut } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import NotificationBell from '@/src/widgets/notification-bell/ui/NotificationBell'

type Props = {
  caseId: string
  active: 'documents' | 'status'
}

export default function TabBar({ caseId, active }: Props) {
  const router = useRouter()
  const clearSession = useSessionStore((s) => s.clearSession)
  const session = useSessionStore((s) => s.session)

  function handleLogout() {
    clearSession()
    router.push('/')
  }

  return (
    <div
      className="w-full bg-white sticky top-0 z-10"
      style={{ borderBottom: '1px solid var(--sb-n100)' }}
    >
      <div className="flex max-w-[640px] mx-auto items-stretch">
        <button
          type="button"
          onClick={() => router.push(`/customer/case/${caseId}/documents`)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-medium transition-colors border-b-2"
          style={
            active === 'documents'
              ? { borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }
              : { borderColor: 'transparent', color: 'var(--sb-n500)' }
          }
        >
          <Tray size={16} weight={active === 'documents' ? 'fill' : 'regular'} />
          서류 업로드
        </button>
        <button
          type="button"
          onClick={() => router.push(`/customer/case/${caseId}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-medium transition-colors border-b-2"
          style={
            active === 'status'
              ? { borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }
              : { borderColor: 'transparent', color: 'var(--sb-n500)' }
          }
        >
          <ClockCounterClockwise size={16} weight={active === 'status' ? 'fill' : 'regular'} />
          상태 & 이력
        </button>
        <div
          className="flex items-center px-3 border-b-2 gap-1"
          style={{ borderColor: 'transparent' }}
        >
          <NotificationBell role="CUSTOMER" userId={session?.userId} />
          <button
            type="button"
            onClick={handleLogout}
            title="로그아웃"
            className="flex items-center justify-center p-1 transition-colors"
            style={{ color: 'var(--sb-n400)' }}
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
