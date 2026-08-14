import { api } from '@/services/apiClient'
import type { AuthSessionResponse, OtpRequest, OtpVerifyRequest, MockLoginRequest } from '@/types/api'

// C11: POST /auth/otp/request
export function requestOtp(body: OtpRequest, token?: string | null) {
  return api.post<{ sent: boolean }>('/auth/otp/request', body, { token })
}

// C12: POST /auth/otp/verify
export function verifyOtp(body: OtpVerifyRequest) {
  return api.post<AuthSessionResponse>('/auth/otp/verify', body)
}

// I7: POST /internal/auth/mock-login (local only)
export function mockInternalLogin(body: MockLoginRequest) {
  return api.post<AuthSessionResponse>('/internal/auth/mock-login', body)
}
