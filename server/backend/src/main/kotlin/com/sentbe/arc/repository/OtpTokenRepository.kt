package com.sentbe.arc.repository

import com.sentbe.arc.domain.OtpToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.OffsetDateTime
import java.util.UUID

interface OtpTokenRepository : JpaRepository<OtpToken, UUID> {
    @Query("""
        SELECT t FROM OtpToken t
        WHERE t.email = :email AND t.code = :code
          AND t.expiresAt > :now AND t.usedAt IS NULL
        ORDER BY t.createdAt DESC
    """)
    fun findValid(email: String, code: String, now: OffsetDateTime): List<OtpToken>
}
