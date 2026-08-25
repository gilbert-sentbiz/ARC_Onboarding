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
      // PI-233: token 미전달(undefined) 시 기존 토큰 보존 — 세션 정보만 갱신할 때
      // 토큰이 null로 덮여 소실되는 버그 방지. 토큰 제거는 clearSession 사용.
      setSession: (session, token) =>
        set((s) => ({ session, token: token !== undefined ? token : s.token })),
      clearSession: () => set({ session: null, token: null }),
      getToken: () => get().token,
    }),
    { name: 'session' }
  )
)
