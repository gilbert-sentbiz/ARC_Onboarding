import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Notification, NotificationType, UserRole } from '@/src/shared/type'

type NotificationStore = {
  notifications: Notification[]
  add: (n: Omit<Notification, 'id' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: (role: UserRole, userId?: string, name?: string) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      add: (n) => {
        const now = Date.now()
        const id = `notif_${now}_${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({ notifications: [...s.notifications, { ...n, id, createdAt: now }] }))
      },
      markRead: (id) => {
        const now = Date.now()
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, readAt: now } : n)),
        }))
      },
      markAllRead: (role, userId, name) => {
        const now = Date.now()
        set((s) => ({
          notifications: s.notifications.map((n) => {
            if (n.readAt) return n
            if (!matchRecipient(n, role, userId, name)) return n
            return { ...n, readAt: now }
          }),
        }))
      },
    }),
    { name: 'notifications' }
  )
)

export function matchRecipient(
  n: Notification,
  role: UserRole,
  userId?: string,
  name?: string
): boolean {
  if (n.recipient.role !== role) return false
  if (role === 'CUSTOMER') return n.recipient.userId === userId
  return !n.recipient.name || n.recipient.name === name
}

export function emitNotification(opts: {
  type: NotificationType
  caseId: string
  caseLabel: string
  message: string
  recipient: { role: UserRole; userId?: string; name?: string }
}) {
  useNotificationStore.getState().add(opts)
}
