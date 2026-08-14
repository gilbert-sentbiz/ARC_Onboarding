import { api } from '@/services/apiClient'
import type { ActiveRulesResponse } from '@/types/api'

// C13: GET /rules/active
export function getActiveRules(segment?: string, token?: string | null) {
  const qs = segment ? `?segment=${encodeURIComponent(segment)}` : ''
  return api.get<ActiveRulesResponse>(`/rules/active${qs}`, { token })
}
