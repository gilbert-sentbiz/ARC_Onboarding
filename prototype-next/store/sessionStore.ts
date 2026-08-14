import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession } from '@/types'

type SessionState = {
  session: UserSession | null
  token: string | null
  setSession: (session: UserSession, token?: string) => void
  clearSession: () => void
  getToken: () => string | null
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      token: null,
      setSession: (session, token) => set({ session, token: token ?? null }),
      clearSession: () => set({ session: null, token: null }),
      getToken: () => get().token,
    }),
    { name: 'session' }
  )
)
