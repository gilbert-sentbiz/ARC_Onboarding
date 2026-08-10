package com.sentbe.arc.api

import com.sentbe.arc.api.dto.CaseResponse
import com.sentbe.arc.api.dto.TransitionRequest
import com.sentbe.arc.service.CaseService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

/**
 * 내부 백오피스 API.
 * 인증 미구현(PI-132). X-Staff-Id 헤더로 직원 식별(임시).
 */
@RestController
@RequestMapping("/internal/cases")
class InternalCaseController(private val caseService: CaseService) {

    // GET /internal/cases — 대시보드 (전체 케이스 목록)
    @GetMapping
    fun listCases(): List<CaseResponse> =
        caseService.getAllCases().map { CaseResponse.fromCase(it) }

    // POST /internal/cases/{id}/transitions — 상태 전이
    @PostMapping("/{id}/transitions")
    fun transition(
        @PathVariable id: UUID,
        @RequestHeader("X-Staff-Id") staffIdHeader: String?,
        @RequestBody req: TransitionRequest
    ): CaseResponse {
        val staffId = staffIdHeader?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "X-Staff-Id 헤더가 필요합니다")

        val case = caseService.transition(
            caseId = id,
            staffId = staffId,
            targetStatus = req.targetStatus,
            reason = req.reason
        )
        return CaseResponse.fromCase(case)
    }
}
