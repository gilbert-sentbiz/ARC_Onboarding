package com.sentbe.arc.repository

import com.sentbe.arc.domain.OnboardingCase
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface OnboardingCaseRepository : JpaRepository<OnboardingCase, UUID> {
    @Query("""
        SELECT c FROM OnboardingCase c WHERE c.customerId = :customerId
        AND c.status NOT IN ('COMPLETED', 'CLOSED')
    """)
    fun findActiveByCustomerId(customerId: UUID): OnboardingCase?

    @Query("SELECT c FROM OnboardingCase c ORDER BY c.updatedAt DESC")
    fun findAllOrderByUpdatedAtDesc(): List<OnboardingCase>
}
