package com.sentbe.arc.api

import com.sentbe.arc.api.dto.RevisionRequestDto
import com.sentbe.arc.api.dto.DocumentFileDto
import com.sentbe.arc.service.DocumentService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * 서류 보완 루프 + 파일 업로드 API.
 * 인증 미구현(PI-132). 직원 작업 = X-Staff-Id, 고객 업로드 = X-Customer-Id 헤더(임시).
 */
@RestController
@RequestMapping("/documents")
class DocumentController(private val documentService: DocumentService) {

    // POST /documents/{id}/revision-requests — 보완 요청 (SALES/OPS/COMPLIANCE)
    @PostMapping("/{id}/revision-requests")
    @ResponseStatus(HttpStatus.CREATED)
    fun requestRevision(
        @PathVariable id: UUID,
        @RequestHeader("X-Staff-Id") staffId: UUID,
        @RequestBody req: RevisionReasonRequest
    ): RevisionRequestDto {
        val rev = documentService.requestRevision(id, staffId, req.reason)
        return RevisionRequestDto.from(rev)
    }

    // POST /documents/{id}/approve — 서류 승인 (COMPLIANCE만)
    @PostMapping("/{id}/approve")
    fun approve(
        @PathVariable id: UUID,
        @RequestHeader("X-Staff-Id") staffId: UUID
    ): Map<String, Any> {
        val doc = documentService.approveDocument(id, staffId)
        return mapOf("id" to doc.id, "status" to doc.status)
    }

    // POST /documents/{id}/files — 파일 업로드 (고객 or 직원)
    @PostMapping("/{id}/files", consumes = ["multipart/form-data"])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadFile(
        @PathVariable id: UUID,
        @RequestParam file: MultipartFile,
        @RequestHeader("X-Customer-Id", required = false) customerId: UUID?,
        @RequestHeader("X-Staff-Id", required = false) staffId: UUID?
    ): DocumentFileDto {
        val uploaderType = if (staffId != null) "STAFF" else "CUSTOMER"
        val docFile = documentService.uploadFile(id, file, uploaderType, staffId)
        return DocumentFileDto.from(docFile)
    }
}

data class RevisionReasonRequest(val reason: String)
