package com.sentbe.arc.repository

import com.sentbe.arc.domain.DocTemplate
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface DocTemplateRepository : JpaRepository<DocTemplate, UUID> {
    @Query("""
        SELECT d FROM DocTemplate d WHERE d.deactivatedAt IS NULL
        AND (d.classification = 'common' OR d.ownerSegmentId = :segmentId)
    """)
    fun findActiveFor(segmentId: UUID): List<DocTemplate>

    @Query("SELECT d FROM DocTemplate d WHERE d.deactivatedAt IS NULL")
    fun findAllActive(): List<DocTemplate>
}
