package com.sentbe.arc.repository

import com.sentbe.arc.domain.CaseEvent
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CaseEventRepository : JpaRepository<CaseEvent, UUID> {
    fun findByCaseIdOrderByCreatedAtAsc(caseId: UUID): List<CaseEvent>
}
