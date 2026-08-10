package com.sentbe.arc.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.api.dto.*
import com.sentbe.arc.auth.AuthContext
import com.sentbe.arc.service.CaseService
import com.sentbe.arc.service.DocumentService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/cases")
class CaseController(
    private val caseService: CaseService,
    private val documentService: DocumentService,
    private val objectMapper: ObjectMapper
) {
    // POST /cases — 케이스 생성
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createCase(@RequestBody req: CreateCaseRequest): CaseResponse {
        val customer = AuthContext.customer
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
        val case = caseService.createCase(
            email = customer.email,
            companyName = req.companyName,
            contactName = req.contactName,
            firstAnswers = req.firstIntakeAnswers
        )
        return CaseResponse.fromCase(case)
    }

    // POST /cases/{id}/intake/first — 1차 제출
    @PostMapping("/{id}/intake/first")
    fun submitFirst(
        @PathVariable id: UUID,
        @RequestBody req: SubmitIntakeRequest
    ): CaseResponse {
        val customer = AuthContext.customer
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
        val case = caseService.submitFirstIntake(id, req.answers, customer.id)
        return CaseResponse.fromCase(case)
    }

    // POST /cases/{id}/intake/second — 2차 제출
    @PostMapping("/{id}/intake/second")
    fun submitSecond(
        @PathVariable id: UUID,
        @RequestBody req: SubmitIntakeRequest
    ): CaseResponse {
        val customer = AuthContext.customer
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
        val case = caseService.submitSecondIntake(id, req.answers, customer.id)
        return CaseResponse.fromCase(case)
    }

    // GET /cases/{id} — 케이스 상세
    @GetMapping("/{id}")
    fun getCase(@PathVariable id: UUID): CaseResponse {
        val customer = AuthContext.customer
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
        val detail = caseService.getCase(id)
        if (detail.case.customerId != customer.id) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "이 케이스에 접근 권한이 없습니다")
        }
        return CaseResponse.from(detail, objectMapper)
    }

    // GET /cases/{id}/intake/second/questions — 핀된 2차 질문 목록
    @GetMapping("/{id}/intake/second/questions")
    fun getSecondQuestions(@PathVariable id: UUID): List<QuestionDto> {
        return caseService.getSecondQuestions(id)
            .map { QuestionDto.from(it, objectMapper) }
    }

    // POST /cases/{id}/resubmit — 고객 보완 재제출
    @PostMapping("/{id}/resubmit")
    fun resubmit(@PathVariable id: UUID): CaseResponse {
        val customer = AuthContext.customer
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
        val detail = caseService.getCase(id)
        if (detail.case.customerId != customer.id) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "이 케이스에 접근 권한이 없습니다")
        }
        val case = documentService.resubmit(id)
        return CaseResponse.fromCase(case)
    }

    // GET /cases/{id}/revisions — 미해결 보완 사유 목록 (고객용)
    @GetMapping("/{id}/revisions")
    fun getOpenRevisions(@PathVariable id: UUID): List<RevisionRequestDto> {
        return documentService.getOpenRevisions(id)
            .map { RevisionRequestDto.from(it) }
    }
}
