package com.sentbe.arc.service

import com.sentbe.arc.domain.*
import com.sentbe.arc.repository.*
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.random.Random

@Service
@Transactional
class AuthService(
    private val customerRepository: CustomerRepository,
    private val staffRepository: StaffRepository,
    private val otpTokenRepository: OtpTokenRepository,
    private val customerSessionRepository: CustomerSessionRepository,
    private val staffSessionRepository: StaffSessionRepository
) {
    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private const val OTP_TTL_MINUTES = 10L
        private const val CUSTOMER_SESSION_HOURS = 24L
        private const val STAFF_SESSION_HOURS = 8L
    }

    // ──────────────────────────────────────────────────────
    // 고객 OTP 발급
    // ──────────────────────────────────────────────────────

    fun requestOtp(email: String) {
        // 고객 존재하지 않으면 첫 로그인이므로 자동 생성
        val customer = customerRepository.findByEmail(email)
            ?: customerRepository.save(Customer().apply { this.email = email })

        val code = "%06d".format(Random.nextInt(100_000, 1_000_000))
        val token = OtpToken().apply {
            this.email = email
            this.code = code
            this.expiresAt = OffsetDateTime.now().plusMinutes(OTP_TTL_MINUTES)
        }
        otpTokenRepository.save(token)

        // AUTH_MODE=console: 로그로 출력. 회사 환경에서는 MailService(SES 등)로 교체.
        log.info("[OTP] email={} code={} expires_at={}", email, code, token.expiresAt)
    }

    // ──────────────────────────────────────────────────────
    // 고객 OTP 검증 → 세션 토큰 발급
    // ──────────────────────────────────────────────────────

    fun verifyOtp(email: String, code: String): String {
        val now = OffsetDateTime.now()
        val otpList = otpTokenRepository.findValid(email, code, now)
        if (otpList.isEmpty()) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "OTP 코드가 올바르지 않거나 만료되었습니다")
        }
        // 가장 최신 OTP 사용 처리
        val otp = otpList.first()
        otp.usedAt = now
        otpTokenRepository.save(otp)

        val customer = customerRepository.findByEmail(email)
            ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "고객 정보를 찾을 수 없습니다")

        val sessionToken = UUID.randomUUID().toString()
        customerSessionRepository.save(CustomerSession().apply {
            this.customerId = customer.id
            this.token = sessionToken
            this.expiresAt = now.plusHours(CUSTOMER_SESSION_HOURS)
        })

        return sessionToken
    }

    // ──────────────────────────────────────────────────────
    // 내부 직원 목 로그인 (로컬 전용)
    // ──────────────────────────────────────────────────────

    fun mockStaffLogin(staffId: UUID): String {
        val staff = staffRepository.findById(staffId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "직원을 찾을 수 없습니다: $staffId")
        }

        val sessionToken = UUID.randomUUID().toString()
        staffSessionRepository.save(StaffSession().apply {
            this.staffId = staff.id
            this.token = sessionToken
            this.expiresAt = OffsetDateTime.now().plusHours(STAFF_SESSION_HOURS)
        })

        return sessionToken
    }

    // ──────────────────────────────────────────────────────
    // 토큰 → 고객/직원 조회 (필터에서 사용)
    // ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun resolveCustomer(token: String): Customer? {
        val session = customerSessionRepository.findActiveByToken(token, OffsetDateTime.now())
            ?: return null
        return customerRepository.findById(session.customerId).orElse(null)
    }

    @Transactional(readOnly = true)
    fun resolveStaff(token: String): Staff? {
        val session = staffSessionRepository.findActiveByToken(token, OffsetDateTime.now())
            ?: return null
        return staffRepository.findById(session.staffId).orElse(null)
    }
}
