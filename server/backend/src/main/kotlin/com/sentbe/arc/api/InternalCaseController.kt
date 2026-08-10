package com.sentbe.arc.api

import com.sentbe.arc.api.dto.CaseResponse
import com.sentbe.arc.api.dto.TransitionRequest
import com.sentbe.arc.auth.AuthContext
import com.sentbe.arc.service.CaseService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

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
        @RequestBody req: TransitionRequest
    ): CaseResponse {
        val staff = AuthContext.staff
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원 인증이 필요합니다")

        val case = caseService.transition(
            caseId = id,
            staffId = staff.id,
            targetStatus = req.targetStatus,
            reason = req.reason
        )
        return CaseResponse.fromCase(case)
    }
}
