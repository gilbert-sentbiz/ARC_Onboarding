package com.sentbe.arc.repository

import com.sentbe.arc.domain.RevisionRequest
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface RevisionRequestRepository : JpaRepository<RevisionRequest, UUID> {
    @Query("SELECT r FROM RevisionRequest r WHERE r.documentId = :documentId AND r.resolvedAt IS NULL")
    fun findOpenByDocumentId(documentId: UUID): List<RevisionRequest>

    @Query("""
        SELECT r FROM RevisionRequest r
        WHERE r.documentId IN (SELECT d.id FROM Document d WHERE d.caseId = :caseId)
        AND r.resolvedAt IS NULL
    """)
    fun findOpenByCaseId(caseId: UUID): List<RevisionRequest>
}
