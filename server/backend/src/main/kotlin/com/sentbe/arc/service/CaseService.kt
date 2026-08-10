package com.sentbe.arc.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.domain.*
import com.sentbe.arc.repository.*
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.OffsetDateTime
import java.util.UUID

@Service
@Transactional
class CaseService(
    private val customerRepository: CustomerRepository,
    private val caseRepository: OnboardingCaseRepository,
    private val intakeRepository: IntakeResponseRepository,
    private val documentRepository: DocumentRepository,
    private val docTemplateRepository: DocTemplateRepository,
    private val segmentRepository: SegmentRepository,
    private val questionRepository: QuestionRepository,
    private val caseEventRepository: CaseEventRepository,
    private val staffRepository: StaffRepository,
    private val segmentClassifier: SegmentClassifier,
    private val objectMapper: ObjectMapper
) {

    // ── 허용된 상태 전이 테이블 (from → allowed tos)
    private val allowedTransitions: Map<String, Set<String>> = mapOf(
        "INITIAL_SCREENING" to setOf("DOCUMENT_SCREENING_REQUIRED", "REVISION_REQUESTED", "CLOSED"),
        "DOCUMENT_SCREENING_REQUIRED" to setOf("APPROVAL_REVIEW_REQUIRED", "REVISION_REQUESTED", "CLOSED"),
        "APPROVAL_REVIEW_REQUIRED" to setOf("ACCOUNT_SETUP_REQUIRED", "REVISION_REQUESTED", "CLOSED"),
        "ACCOUNT_SETUP_REQUIRED" to setOf("COMPLETED", "CLOSED"),
        "DOCUMENT_SUBMISSION_REQUIRED" to setOf("INITIAL_SCREENING", "CLOSED"),
        "REVISION_REQUESTED" to setOf("CLOSED")
    )

    // 각 전이에 필요한 역할
    private val transitionRoles: Map<Pair<String, String>, Set<String>> = mapOf(
        ("INITIAL_SCREENING" to "DOCUMENT_SCREENING_REQUIRED") to setOf("SALES"),
        ("DOCUMENT_SCREENING_REQUIRED" to "APPROVAL_REVIEW_REQUIRED") to setOf("OPS"),
        ("APPROVAL_REVIEW_REQUIRED" to "ACCOUNT_SETUP_REQUIRED") to setOf("COMPLIANCE"),
        ("ACCOUNT_SETUP_REQUIRED" to "COMPLETED") to setOf("OPS"),
        ("INITIAL_SCREENING" to "REVISION_REQUESTED") to setOf("SALES", "OPS", "COMPLIANCE"),
        ("DOCUMENT_SCREENING_REQUIRED" to "REVISION_REQUESTED") to setOf("SALES", "OPS", "COMPLIANCE"),
        ("APPROVAL_REVIEW_REQUIRED" to "REVISION_REQUESTED") to setOf("SALES", "OPS", "COMPLIANCE"),
        ("DOCUMENT_SUBMISSION_REQUIRED" to "INITIAL_SCREENING") to setOf("OPS", "SALES"),
    )

    // ────────────────────────────────────────────────────────────────
    // 케이스 생성 (POST /cases)
    // ────────────────────────────────────────────────────────────────

    fun createCase(
        email: String,
        companyName: String?,
        contactName: String?,
        firstAnswers: Map<String, Any>
    ): OnboardingCase {
        val customer = customerRepository.findByEmail(email) ?: run {
            val c = Customer().apply {
                this.email = email
                this.companyName = companyName
                this.contactName = contactName
            }
            customerRepository.save(c)
        }

        if (caseRepository.findActiveByCustomerId(customer.id) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "이미 진행 중인 케이스가 있습니다")
        }

        // 활성 1차 질문 고정
        val firstQuestions = questionRepository.findActiveByPhase("first")
        val pinnedFirst = firstQuestions.map { it.id }

        val pinnedJson = objectMapper.writeValueAsString(
            mapOf("first" to pinnedFirst, "second" to emptyList<UUID>())
        )

        val case = OnboardingCase().apply {
            this.customerId = customer.id
            this.pinnedQuestionIds = pinnedJson
        }
        caseRepository.save(case)

        // 1차 응답 저장
        val intake = IntakeResponse().apply {
            this.caseId = case.id
            this.phase = "first"
            this.answers = objectMapper.writeValueAsString(firstAnswers)
        }
        intakeRepository.save(intake)

        // 고객 정보 캐시 업데이트 (1차 응답에서 복사)
        if (companyName != null) customer.companyName = companyName
        if (contactName != null) customer.contactName = contactName
        customerRepository.save(customer)

        appendEvent(case.id, "CASE_CREATED", "CUSTOMER", customer.id,
            mapOf("status" to case.status))

        return case
    }

    // ────────────────────────────────────────────────────────────────
    // 1차 제출 (POST /cases/{id}/intake/first)
    // ────────────────────────────────────────────────────────────────

    fun submitFirstIntake(caseId: UUID, answers: Map<String, Any>, customerId: UUID): OnboardingCase {
        val case = loadCase(caseId)
        if (case.customerId != customerId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "이 케이스에 접근 권한이 없습니다")
        }
        if (case.status != "INQUIRY_RECEIVED") {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "케이스 상태가 INQUIRY_RECEIVED가 아닙니다")
        }

        // 1차 응답 업데이트
        val intake = intakeRepository.findByCaseIdAndPhase(caseId, "first")
            ?: IntakeResponse().apply { this.caseId = caseId; this.phase = "first" }
        intake.answers = objectMapper.writeValueAsString(answers)
        intake.status = "submitted"
        intake.submittedAt = OffsetDateTime.now()
        intakeRepository.save(intake)

        // 분류 평가
        val pinned = objectMapper.readValue(case.pinnedQuestionIds, Map::class.java)
        @Suppress("UNCHECKED_CAST")
        val pinnedFirst = (pinned["first"] as? List<String> ?: emptyList())
            .map { UUID.fromString(it) }

        val classification = segmentClassifier.classify(answers, pinnedFirst)

        // 2차 질문 고정
        val entitySegment = classification.entityCode?.let { code ->
            segmentRepository.findByCodeAndDeactivatedAtIsNull(code)
        }
        val secondQuestions = if (entitySegment != null) {
            questionRepository.findActiveSecondPhaseFor(entitySegment.id)
        } else {
            questionRepository.findActiveByPhase("second")
        }
        val pinnedSecond = secondQuestions.map { it.id }

        val updatedPinned = mapOf("first" to pinnedFirst, "second" to pinnedSecond)
        case.pinnedQuestionIds = objectMapper.writeValueAsString(updatedPinned)
        case.entityCode = classification.entityCode
        case.services = classification.services.toTypedArray()
        case.segmentMeta = objectMapper.writeValueAsString(classification.segmentMeta)
        case.updatedAt = OffsetDateTime.now()
        case.lastCustomerActionAt = OffsetDateTime.now()
        caseRepository.save(case)

        appendEvent(case.id, "CASE_STATUS_CHANGED", "CUSTOMER", null,
            mapOf("action" to "first_intake_submitted",
                "entityCode" to (classification.entityCode ?: ""),
                "services" to classification.services))

        return case
    }

    // ────────────────────────────────────────────────────────────────
    // 2차 제출 (POST /cases/{id}/intake/second)
    // ────────────────────────────────────────────────────────────────

    fun submitSecondIntake(caseId: UUID, answers: Map<String, Any>, customerId: UUID): OnboardingCase {
        val case = loadCase(caseId)
        if (case.customerId != customerId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "이 케이스에 접근 권한이 없습니다")
        }
        if (case.status != "INQUIRY_RECEIVED") {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "케이스 상태가 INQUIRY_RECEIVED가 아닙니다")
        }
        if (case.entityCode == null) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "1차 제출(분류)이 먼저 완료되어야 합니다")
        }

        // 2차 응답 저장
        val intake = intakeRepository.findByCaseIdAndPhase(caseId, "second")
            ?: IntakeResponse().apply { this.caseId = caseId; this.phase = "second" }
        intake.answers = objectMapper.writeValueAsString(answers)
        intake.status = "submitted"
        intake.submittedAt = OffsetDateTime.now()
        intakeRepository.save(intake)

        // 서류 목록 생성 (doc_template → document 복사, type dedup)
        val entitySegment = segmentRepository.findByCodeAndDeactivatedAtIsNull(case.entityCode!!)
            ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "세그먼트를 찾을 수 없습니다")

        val templates = docTemplateRepository.findActiveFor(entitySegment.id)
        for (template in templates) {
            if (!documentRepository.existsByCaseIdAndType(caseId, template.type)) {
                val doc = Document().apply {
                    this.caseId = caseId
                    this.docTemplateId = template.id
                    this.type = template.type
                    this.displayName = template.displayName
                    this.isRequired = template.isRequired
                }
                documentRepository.save(doc)
            }
        }

        // DOCUMENT_SUBMISSION_REQUIRED로 전이
        val prevStatus = case.status
        case.status = "DOCUMENT_SUBMISSION_REQUIRED"
        case.updatedAt = OffsetDateTime.now()
        case.lastCustomerActionAt = OffsetDateTime.now()
        caseRepository.save(case)

        appendEvent(case.id, "CASE_STATUS_CHANGED", "CUSTOMER", null,
            mapOf("prev" to prevStatus, "next" to case.status,
                "action" to "second_intake_submitted"))

        return case
    }

    // ────────────────────────────────────────────────────────────────
    // 케이스 조회 (GET /cases/{id})
    // ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getCase(caseId: UUID): CaseDetail {
        val case = loadCase(caseId)
        val intakes = intakeRepository.findByCaseId(caseId)
        val documents = documentRepository.findByCaseId(caseId)
        val events = caseEventRepository.findByCaseIdOrderByCreatedAtAsc(caseId)
        return CaseDetail(case, intakes, documents, events)
    }

    // ────────────────────────────────────────────────────────────────
    // 대시보드 (GET /cases) — 내부
    // ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getAllCases(): List<OnboardingCase> = caseRepository.findAllOrderByUpdatedAtDesc()

    // ────────────────────────────────────────────────────────────────
    // 상태 전이 (POST /cases/{id}/transitions) — 내부
    // ────────────────────────────────────────────────────────────────

    fun transition(
        caseId: UUID,
        staffId: UUID,
        targetStatus: String,
        reason: String?
    ): OnboardingCase {
        val case = loadCase(caseId)
        val staff = staffRepository.findById(staffId).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "직원을 찾을 수 없습니다")
        }

        val from = case.status
        val allowedTo = allowedTransitions[from]
            ?: throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "현재 상태 $from 에서는 전이할 수 없습니다")

        if (targetStatus !in allowedTo) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "$from → $targetStatus 전이는 허용되지 않습니다")
        }

        val requiredRoles = transitionRoles[from to targetStatus]
        if (requiredRoles != null && staff.role !in requiredRoles) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN,
                "${staff.role} 역할은 이 전이를 수행할 수 없습니다. 필요 역할: $requiredRoles")
        }

        if (targetStatus == "REVISION_REQUESTED" && reason.isNullOrBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "보완 요청 시 사유를 입력해야 합니다")
        }

        if (targetStatus == "CLOSED" && reason.isNullOrBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "종료 시 사유를 입력해야 합니다")
        }

        val prevStatus = case.status
        case.status = targetStatus

        // 보완 요청 단계 기록
        if (targetStatus == "REVISION_REQUESTED") {
            case.revisionRequestedFrom = from
        }
        // 보완 복귀: REVISION_REQUESTED → revision_requested_from 단계는 고객 resubmit으로 처리
        // CLOSED 사유 기록
        if (targetStatus == "CLOSED") {
            case.closeReason = "DROPPED"
        }

        case.updatedAt = OffsetDateTime.now()
        caseRepository.save(case)

        appendEvent(case.id, "CASE_STATUS_CHANGED", "STAFF", staffId,
            mapOf("prev" to prevStatus, "next" to targetStatus,
                "reason" to (reason ?: ""), "staffRole" to staff.role))

        return case
    }

    // ────────────────────────────────────────────────────────────────
    // 활성 룰 조회 (GET /rules/active) — 질문 렌더용
    // ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getActiveRules(): ActiveRules {
        val segments = segmentRepository.findAllActive()
        val firstQuestions = questionRepository.findActiveByPhase("first")
        val templates = docTemplateRepository.findAllActive()
        return ActiveRules(segments, firstQuestions, templates)
    }

    // ────────────────────────────────────────────────────────────────
    // 핀된 2차 질문 조회 (GET /cases/{id}/intake/second/questions)
    // ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getSecondQuestions(caseId: UUID): List<com.sentbe.arc.domain.Question> {
        val case = loadCase(caseId)
        val pinned = objectMapper.readValue(case.pinnedQuestionIds, Map::class.java)
        @Suppress("UNCHECKED_CAST")
        val secondIds = (pinned["second"] as? List<String> ?: emptyList())
            .map { UUID.fromString(it) }
        return if (secondIds.isEmpty()) emptyList()
        else questionRepository.findByIdIn(secondIds)
    }

    // ────────────────────────────────────────────────────────────────
    // 내부 헬퍼
    // ────────────────────────────────────────────────────────────────

    private fun loadCase(caseId: UUID): OnboardingCase =
        caseRepository.findById(caseId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "케이스를 찾을 수 없습니다: $caseId")
        }

    private fun appendEvent(
        caseId: UUID,
        eventType: String,
        actorType: String,
        actorId: UUID?,
        payload: Map<String, Any>
    ) {
        val event = CaseEvent().apply {
            this.caseId = caseId
            this.eventType = eventType
            this.actorType = actorType
            this.actorId = actorId
            this.payload = objectMapper.writeValueAsString(payload)
        }
        caseEventRepository.save(event)
    }
}

// 조회 결과 집계 DTO (도메인 객체 모음)
data class CaseDetail(
    val case: OnboardingCase,
    val intakes: List<IntakeResponse>,
    val documents: List<Document>,
    val events: List<CaseEvent>
)

data class ActiveRules(
    val segments: List<com.sentbe.arc.domain.Segment>,
    val firstQuestions: List<com.sentbe.arc.domain.Question>,
    val docTemplates: List<com.sentbe.arc.domain.DocTemplate>
)
