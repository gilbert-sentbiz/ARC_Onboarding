package com.sentbe.arc.auth

import com.sentbe.arc.service.AuthService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(20)
class StaffAuthFilter(private val authService: AuthService) : OncePerRequestFilter() {

    // /internal/** 경로에만 적용
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        !request.requestURI.startsWith("/internal/")

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        // /internal/auth/** 은 인증 없이 접근 (로그인 엔드포인트)
        if (request.requestURI.startsWith("/internal/auth/")) {
            chain.doFilter(request, response)
            return
        }

        val token = extractBearer(request)
        if (token == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "직원 인증이 필요합니다 (Authorization: Bearer <token>)")
            return
        }

        val staff = authService.resolveStaff(token)
        if (staff == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "유효하지 않거나 만료된 직원 세션입니다")
            return
        }

        AuthContext.staff = staff
        try {
            chain.doFilter(request, response)
        } finally {
            AuthContext.clear()
        }
    }

    private fun extractBearer(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization") ?: return null
        return if (header.startsWith("Bearer ")) header.removePrefix("Bearer ").trim() else null
    }
}
