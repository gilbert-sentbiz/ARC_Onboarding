package com.sentbe.arc.api

import com.sentbe.arc.api.dto.RevisionRequestDto
import com.sentbe.arc.api.dto.DocumentFileDto
import com.sentbe.arc.auth.AuthContext
import com.sentbe.arc.service.DocumentService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/documents")
class DocumentController(private val documentService: DocumentService) {

    // POST /documents/{id}/revision-requests — 보완 요청 (SALES/OPS/COMPLIANCE)
    @PostMapping("/{id}/revision-requests")
    @ResponseStatus(HttpStatus.CREATED)
    fun requestRevision(
        @PathVariable id: UUID,
        @RequestBody req: RevisionReasonRequest
    ): RevisionRequestDto {
        val staff = AuthContext.staff
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원 인증이 필요합니다")
        val rev = documentService.requestRevision(id, staff.id, req.reason)
        return RevisionRequestDto.from(rev)
    }

    // POST /documents/{id}/approve — 서류 승인 (COMPLIANCE만)
    @PostMapping("/{id}/approve")
    fun approve(@PathVariable id: UUID): Map<String, Any> {
        val staff = AuthContext.staff
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원 인증이 필요합니다")
        val doc = documentService.approveDocument(id, staff.id)
        return mapOf("id" to doc.id, "status" to doc.status)
    }

    // POST /documents/{id}/files — 파일 업로드 (고객 또는 직원)
    @PostMapping("/{id}/files", consumes = ["multipart/form-data"])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadFile(
        @PathVariable id: UUID,
        @RequestParam file: MultipartFile
    ): DocumentFileDto {
        val staff = AuthContext.staff
        val uploaderType = if (staff != null) "STAFF" else "CUSTOMER"
        val docFile = documentService.uploadFile(id, file, uploaderType, staff?.id)
        return DocumentFileDto.from(docFile)
    }
}

data class RevisionReasonRequest(val reason: String)
