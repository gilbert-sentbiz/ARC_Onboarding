package com.sentbe.arc.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.domain.DocumentFile
import com.sentbe.arc.domain.RevisionRequest
import com.sentbe.arc.repository.*
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.OffsetDateTime
import java.util.UUID

@Service
@Transactional
class DocumentService(
    private val documentRepository: DocumentRepository,
    private val documentFileRepository: DocumentFileRepository,
    private val revisionRequestRepository: RevisionRequestRepository,
    private val caseRepository: OnboardingCaseRepository,
    private val caseEventRepository: CaseEventRepository,
    private val staffRepository: StaffRepository,
    private val storageService: StorageService,
    private val objectMapper: ObjectMapper
) {
    // ──────────────────────────────────────────────────────
    // 보완 요청 (POST /documents/{id}/revision-requests)
    // ──────────────────────────────────────────────────────

    fun requestRevision(documentId: UUID, staffId: UUID, reason: String): RevisionRequest {
        if (reason.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "보완 요청 사유를 입력해야 합니다")
        }

        val document = documentRepository.findById(documentId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "서류를 찾을 수 없습니다: $documentId")
        }
        val staff = staffRepository.findById(staffId).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원을 찾을 수 없습니다")
        }
        if (staff.role !in setOf("SALES", "OPS", "COMPLIANCE")) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "보완 요청 권한이 없습니다")
        }

        val case = caseRepository.findById(document.caseId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "케이스를 찾을 수 없습니다")
        }
        val reviewStatuses = setOf("INITIAL_SCREENING", "DOCUMENT_SCREENING_REQUIRED", "APPROVAL_REVIEW_REQUIRED")
        if (case.status !in reviewStatuses) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "현재 상태(${case.status})에서는 보완 요청할 수 없습니다")
        }

        // 서류 상태 → REVISION_REQUIRED
        document.status = "REVISION_REQUIRED"
        document.updatedAt = OffsetDateTime.now()
        documentRepository.save(document)

        // 보완 요청 기록
        val revRequest = RevisionRequest().apply {
            this.documentId = documentId
            this.reason = reason
            this.requestedByStaffId = staffId
            this.requestedFromStatus = case.status
        }
        revisionRequestRepository.save(revRequest)

        // 케이스 REVISION_REQUESTED 전이
        val prevStatus = case.status
        case.status = "REVISION_REQUESTED"
        case.revisionRequestedFrom = prevStatus
        case.updatedAt = OffsetDateTime.now()
        caseRepository.save(case)

        appendEvent(case.id, "CASE_STATUS_CHANGED", "STAFF", staffId,
            mapOf("prev" to prevStatus, "next" to "REVISION_REQUESTED",
                "documentId" to documentId.toString(), "reason" to reason))

        return revRequest
    }

    // ──────────────────────────────────────────────────────
    // 서류 승인 (POST /documents/{id}/approve) — COMPLIANCE만
    // ──────────────────────────────────────────────────────

    fun approveDocument(documentId: UUID, staffId: UUID): com.sentbe.arc.domain.Document {
        val staff = staffRepository.findById(staffId).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원을 찾을 수 없습니다")
        }
        if (staff.role != "COMPLIANCE") {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "컴플라이언스 역할만 서류를 승인할 수 있습니다")
        }

        val document = documentRepository.findById(documentId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "서류를 찾을 수 없습니다")
        }
        if (document.status !in setOf("SUBMITTED", "REVISION_REQUIRED")) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "제출된 서류만 승인할 수 있습니다 (현재 상태: ${document.status})")
        }

        val prevStatus = document.status
        document.status = "APPROVED"
        document.updatedAt = OffsetDateTime.now()
        documentRepository.save(document)

        appendEvent(document.caseId, "DOC_STATUS_CHANGED", "STAFF", staffId,
            mapOf("documentId" to documentId.toString(), "prev" to prevStatus, "next" to "APPROVED"))

        return document
    }

    // ──────────────────────────────────────────────────────
    // 파일 업로드 (POST /documents/{id}/files)
    // ──────────────────────────────────────────────────────

    fun uploadFile(
        documentId: UUID,
        file: MultipartFile,
        uploaderType: String = "CUSTOMER",
        uploaderStaffId: UUID? = null
    ): DocumentFile {
        storageService.validateFile(file)

        val document = documentRepository.findById(documentId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "서류를 찾을 수 없습니다")
        }

        // 기존 is_latest 파일 → false (재업로드 허용, 이전본 보존)
        documentFileRepository.markAllNotLatest(documentId)

        val ext = file.originalFilename?.substringAfterLast('.', "") ?: ""
        val storageKey = "cases/${document.caseId}/documents/${documentId}/${UUID.randomUUID()}.$ext"
        storageService.upload(storageKey, file)

        val docFile = DocumentFile().apply {
            this.documentId = documentId
            this.fileName = file.originalFilename ?: file.name
            this.fileSize = file.size.coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
            this.mimeType = file.contentType ?: ""
            this.storageKey = storageKey
            this.uploaderType = uploaderType
            this.uploaderStaffId = uploaderStaffId
            this.isLatest = true
        }
        documentFileRepository.save(docFile)

        // 서류 상태 → SUBMITTED
        val prevStatus = document.status
        document.status = "SUBMITTED"
        document.updatedAt = OffsetDateTime.now()
        documentRepository.save(document)

        appendEvent(document.caseId, "DOC_STATUS_CHANGED", uploaderType, uploaderStaffId,
            mapOf("documentId" to documentId.toString(), "prev" to prevStatus, "next" to "SUBMITTED",
                "fileName" to docFile.fileName))

        return docFile
    }

    // ──────────────────────────────────────────────────────
    // 고객 재제출 (POST /cases/{id}/resubmit)
    // ──────────────────────────────────────────────────────

    fun resubmit(caseId: UUID): com.sentbe.arc.domain.OnboardingCase {
        val case = caseRepository.findById(caseId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "케이스를 찾을 수 없습니다")
        }
        if (case.status != "REVISION_REQUESTED") {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "보완 요청 상태(REVISION_REQUESTED)인 케이스만 재제출할 수 있습니다")
        }
        val returnTo = case.revisionRequestedFrom
            ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "revision_requested_from이 비어 있습니다")

        // 미해결 revision_request 전부 resolved
        val openRequests = revisionRequestRepository.findOpenByCaseId(caseId)
        val now = OffsetDateTime.now()
        openRequests.forEach { it.resolvedAt = now }
        revisionRequestRepository.saveAll(openRequests)

        // 케이스 상태 복귀
        val prevStatus = case.status
        case.status = returnTo
        case.revisionRequestedFrom = null
        case.updatedAt = now
        case.lastCustomerActionAt = now
        caseRepository.save(case)

        appendEvent(caseId, "CASE_STATUS_CHANGED", "CUSTOMER", null,
            mapOf("prev" to prevStatus, "next" to returnTo,
                "action" to "resubmit", "resolvedRevisions" to openRequests.size))

        return case
    }

    // 미해결 보완 사유 조회 (고객용)
    @Transactional(readOnly = true)
    fun getOpenRevisions(caseId: UUID): List<RevisionRequest> =
        revisionRequestRepository.findOpenByCaseId(caseId)

    private fun appendEvent(
        caseId: UUID, eventType: String, actorType: String, actorId: UUID?,
        payload: Map<String, Any>
    ) {
        val event = com.sentbe.arc.domain.CaseEvent().apply {
            this.caseId = caseId
            this.eventType = eventType
            this.actorType = actorType
            this.actorId = actorId
            this.payload = objectMapper.writeValueAsString(payload)
        }
        caseEventRepository.save(event)
    }
}
