import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AccountState = {
  accounts: Record<string, string> // email → password
  register: (email: string, password: string) => void
  verify: (email: string, password: string) => boolean
  exists: (email: string) => boolean
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: {},
      register: (email, password) =>
        set((s) => ({ accounts: { ...s.accounts, [email]: password } })),
      verify: (email, password) => get().accounts[email] === password,
      exists: (email) => email in get().accounts,
    }),
    { name: 'accounts' }
  )
)
