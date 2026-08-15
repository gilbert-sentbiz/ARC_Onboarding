import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession } from '../types'
import { setCustomerToken, setStaffToken, clearTokens } from '../services/arcApi'

interface SessionState {
  session: UserSession | null
  activeCaseId: string | null
  setSession: (session: UserSession, token?: string) => void
  setStaffSession: (session: UserSession, token: string) => void
  setActiveCaseId: (id: string) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      activeCaseId: null,
      setSession: (session, token) => {
        if (token) setCustomerToken(token)
        set({ session })
      },
      setStaffSession: (session, token) => {
        setStaffToken(token)
        set({ session })
      },
      setActiveCaseId: (id) => set({ activeCaseId: id }),
      clearSession: () => {
        clearTokens()
        set({ session: null, activeCaseId: null })
      },
    }),
    { name: 'session' }
  )
)
