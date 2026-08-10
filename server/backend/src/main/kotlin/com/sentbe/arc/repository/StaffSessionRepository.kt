package com.sentbe.arc.repository

import com.sentbe.arc.domain.StaffSession
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.OffsetDateTime
import java.util.UUID

interface StaffSessionRepository : JpaRepository<StaffSession, UUID> {
    @Query("SELECT s FROM StaffSession s WHERE s.token = :token AND s.expiresAt > :now")
    fun findActiveByToken(token: String, now: OffsetDateTime): StaffSession?
}
