import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession } from '../types'

interface SessionState {
  session: UserSession | null
  setSession: (session: UserSession) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    { name: 'session' }
  )
)
