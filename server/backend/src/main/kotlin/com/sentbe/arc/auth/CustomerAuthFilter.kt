package com.sentbe.arc.auth

import com.sentbe.arc.service.AuthService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(10)
class CustomerAuthFilter(private val authService: AuthService) : OncePerRequestFilter() {

    // 인증 불필요한 경로
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        return path.startsWith("/auth/") ||
            path.startsWith("/internal/") ||
            path.startsWith("/rules/") ||
            path.startsWith("/actuator/") ||
            path == "/health"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        val token = extractBearer(request)
        if (token == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "고객 인증이 필요합니다 (Authorization: Bearer <token>)")
            return
        }

        val customer = authService.resolveCustomer(token)
        if (customer == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "유효하지 않거나 만료된 세션입니다")
            return
        }

        AuthContext.customer = customer
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
