package com.sentbe.arc.repository

import com.sentbe.arc.domain.IntakeResponse
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface IntakeResponseRepository : JpaRepository<IntakeResponse, UUID> {
    fun findByCaseIdAndPhase(caseId: UUID, phase: String): IntakeResponse?
    fun findByCaseId(caseId: UUID): List<IntakeResponse>
}
