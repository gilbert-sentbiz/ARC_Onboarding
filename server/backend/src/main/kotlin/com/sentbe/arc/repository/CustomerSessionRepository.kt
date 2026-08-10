package com.sentbe.arc.repository

import com.sentbe.arc.domain.CustomerSession
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.OffsetDateTime
import java.util.UUID

interface CustomerSessionRepository : JpaRepository<CustomerSession, UUID> {
    @Query("SELECT s FROM CustomerSession s WHERE s.token = :token AND s.expiresAt > :now")
    fun findActiveByToken(token: String, now: OffsetDateTime): CustomerSession?
}
