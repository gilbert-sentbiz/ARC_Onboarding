import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InternalStaff } from '../types'

const DEMO_ACCOUNTS: InternalStaff[] = [
  { email: 'sales@sentbe.com',      password: 'sentbe1234', role: 'SALES',      name: '김영업' },
  { email: 'compliance@sentbe.com', password: 'sentbe1234', role: 'COMPLIANCE', name: '이컴플' },
  { email: 'ops@sentbe.com',        password: 'sentbe1234', role: 'OPS',        name: '박운영' },
]

interface InternalStaffState {
  staff: InternalStaff[]
  login: (email: string, password: string) => InternalStaff | null
}

export const useInternalStaffStore = create<InternalStaffState>()(
  persist(
    (_, get) => ({
      staff: DEMO_ACCOUNTS,
      login: (email, password) => {
        const found = get().staff.find(
          (s) => s.email === email && s.password === password
        )
        return found ?? null
      },
    }),
    { name: 'internal_staff' }
  )
)
