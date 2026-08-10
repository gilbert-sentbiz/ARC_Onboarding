package com.sentbe.arc.repository

import com.sentbe.arc.domain.Document
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface DocumentRepository : JpaRepository<Document, UUID> {
    fun findByCaseId(caseId: UUID): List<Document>
    fun existsByCaseIdAndType(caseId: UUID, type: String): Boolean
}
