package com.sentbe.arc.api

import com.sentbe.arc.service.AuthService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 고객 OTP 인증 + 내부 목 SSO 로그인.
 * /internal/auth/mock-login 은 로컬 개발 전용 — 회사 환경에서는 실제 구글 SSO로 교체.
 */
@RestController
class AuthController(private val authService: AuthService) {

    // POST /auth/otp/request — OTP 코드 발급 (콘솔 로그 출력)
    @PostMapping("/auth/otp/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun requestOtp(@RequestBody req: OtpRequestBody) {
        authService.requestOtp(req.email)
    }

    // POST /auth/otp/verify — OTP 검증 → 세션 토큰 반환
    @PostMapping("/auth/otp/verify")
    fun verifyOtp(@RequestBody req: OtpVerifyBody): TokenResponse {
        val token = authService.verifyOtp(req.email, req.code)
        return TokenResponse(token)
    }

    // POST /internal/auth/mock-login — 내부 직원 목 로그인 (로컬 전용)
    @PostMapping("/internal/auth/mock-login")
    fun mockStaffLogin(@RequestBody req: StaffLoginBody): TokenResponse {
        val token = authService.mockStaffLogin(req.staffId)
        return TokenResponse(token)
    }
}

data class OtpRequestBody(val email: String)
data class OtpVerifyBody(val email: String, val code: String)
data class StaffLoginBody(val staffId: UUID)
data class TokenResponse(val token: String)
