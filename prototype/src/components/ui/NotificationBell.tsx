import { useState, useRef, useEffect } from 'react'
import { Bell } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore, matchRecipient } from '../../store/notificationStore'
import type { Notification, UserRole } from '../../types'

interface Props {
  role: UserRole
  userId?: string
  name?: string
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function NotificationBell({ role, userId, name }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const allNotifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)

  const notifications = allNotifications
    .filter((n) => matchRecipient(n, role, userId, name))
    .sort((a, b) => b.createdAt - a.createdAt)

  const unreadCount = notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleClickNotif(n: Notification) {
    markRead(n.id)
    setOpen(false)
    const route =
      role === 'CUSTOMER'
        ? `/customer/case/${n.caseId}`
        : `/internal/case/${n.caseId}`
    navigate(route)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-sb-n100 transition-colors"
      >
        <Bell size={18} className="text-sb-n600" weight={unreadCount > 0 ? 'fill' : 'regular'} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-[3px] bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-[12px] border border-sb-n100 z-50 overflow-hidden" style={{ boxShadow: 'var(--shadow-200)' }}>
          <div className="px-4 py-3 border-b border-sb-n100 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-sb-n900">알림</span>
            {unreadCount > 0 && (
              <span className="text-[11px] text-sb-n400">{unreadCount}개 미읽음</span>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-[13px] text-sb-n400 text-center py-8">알림이 없습니다.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  className={`w-full text-left px-4 py-3 border-b border-sb-n50 hover:bg-sb-n50 transition-colors ${!n.readAt ? 'bg-blue-50/40' : ''}`}
                >
                  {!n.readAt && (
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sb-brand flex-shrink-0 mt-[5px]" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-sb-n800 leading-relaxed">{n.message}</p>
                        <p className="text-[11px] text-sb-n400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  )}
                  {n.readAt && (
                    <>
                      <p className="text-[13px] text-sb-n600 leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-sb-n400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                    </>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
