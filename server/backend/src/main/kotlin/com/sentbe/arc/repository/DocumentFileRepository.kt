package com.sentbe.arc.repository

import com.sentbe.arc.domain.DocumentFile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface DocumentFileRepository : JpaRepository<DocumentFile, UUID> {
    fun findByDocumentIdAndIsLatestTrue(documentId: UUID): DocumentFile?
    fun findByDocumentIdOrderByUploadedAtDesc(documentId: UUID): List<DocumentFile>

    @Modifying
    @Query("UPDATE DocumentFile f SET f.isLatest = false WHERE f.documentId = :documentId")
    fun markAllNotLatest(documentId: UUID)
}
