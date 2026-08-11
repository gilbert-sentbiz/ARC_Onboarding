package com.sentbe.arc.api

import com.sentbe.arc.api.dto.DocumentFileDto
import com.sentbe.arc.auth.AuthContext
import com.sentbe.arc.service.DocumentService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

@RestController
@RequestMapping("/documents")
class DocumentController(private val documentService: DocumentService) {

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
