package com.sentbe.arc.api.dto

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.domain.*
import com.sentbe.arc.service.ActiveRules
import com.sentbe.arc.service.CaseDetail
import java.time.OffsetDateTime
import java.util.UUID

data class CaseResponse(
    val id: UUID,
    val customerId: UUID,
    val status: String,
    val entityCode: String?,
    val services: List<String>,
    val segmentMeta: Any?,
    val pinnedQuestionIds: Any?,
    val assigneeStaffId: UUID?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
    val intakes: List<IntakeDto>?,
    val documents: List<DocumentDto>?,
    val events: List<EventDto>?
) {
    companion object {
        fun from(detail: CaseDetail, objectMapper: ObjectMapper): CaseResponse {
            val c = detail.case
            return CaseResponse(
                id = c.id,
                customerId = c.customerId,
                status = c.status,
                entityCode = c.entityCode,
                services = c.services.toList(),
                segmentMeta = runCatching { objectMapper.readValue(c.segmentMeta, Any::class.java) }.getOrNull(),
                pinnedQuestionIds = runCatching { objectMapper.readValue(c.pinnedQuestionIds, Any::class.java) }.getOrNull(),
                assigneeStaffId = c.assigneeStaffId,
                createdAt = c.createdAt,
                updatedAt = c.updatedAt,
                intakes = detail.intakes.map { IntakeDto.from(it, objectMapper) },
                documents = detail.documents.map { DocumentDto.from(it) },
                events = detail.events.map { EventDto.from(it, objectMapper) }
            )
        }

        fun fromCase(c: OnboardingCase): CaseResponse = CaseResponse(
            id = c.id,
            customerId = c.customerId,
            status = c.status,
            entityCode = c.entityCode,
            services = c.services.toList(),
            segmentMeta = null,
            pinnedQuestionIds = null,
            assigneeStaffId = c.assigneeStaffId,
            createdAt = c.createdAt,
            updatedAt = c.updatedAt,
            intakes = null,
            documents = null,
            events = null
        )
    }
}

data class IntakeDto(
    val id: UUID,
    val phase: String,
    val status: String,
    val answers: Any?,
    val submittedAt: OffsetDateTime?
) {
    companion object {
        fun from(r: IntakeResponse, objectMapper: ObjectMapper) = IntakeDto(
            id = r.id,
            phase = r.phase,
            status = r.status,
            answers = runCatching { objectMapper.readValue(r.answers, Any::class.java) }.getOrNull(),
            submittedAt = r.submittedAt
        )
    }
}

data class DocumentDto(
    val id: UUID,
    val type: String,
    val displayName: String,
    val status: String,
    val isRequired: Boolean
) {
    companion object {
        fun from(d: Document) = DocumentDto(
            id = d.id,
            type = d.type,
            displayName = d.displayName,
            status = d.status,
            isRequired = d.isRequired
        )
    }
}

data class EventDto(
    val id: UUID,
    val eventType: String,
    val actorType: String,
    val actorId: UUID?,
    val payload: Any?,
    val createdAt: OffsetDateTime
) {
    companion object {
        fun from(e: CaseEvent, objectMapper: ObjectMapper) = EventDto(
            id = e.id,
            eventType = e.eventType,
            actorType = e.actorType,
            actorId = e.actorId,
            payload = runCatching { objectMapper.readValue(e.payload, Any::class.java) }.getOrNull(),
            createdAt = e.createdAt
        )
    }
}

data class QuestionDto(
    val id: UUID,
    val code: String,
    val phase: String,
    val classification: String,
    val ownerSegmentId: UUID?,
    val label: String,
    val inputType: String,
    val options: Any?,
    val isRequired: Boolean,
    val showWhen: Any?,
    val repeat: Boolean,
    val parentQuestionId: UUID?,
    val displayOrder: Int
) {
    companion object {
        fun from(q: com.sentbe.arc.domain.Question, objectMapper: ObjectMapper) = QuestionDto(
            id = q.id,
            code = q.code,
            phase = q.phase,
            classification = q.classification,
            ownerSegmentId = q.ownerSegmentId,
            label = q.label,
            inputType = q.inputType,
            options = q.options?.let { runCatching { objectMapper.readValue(it, Any::class.java) }.getOrNull() },
            isRequired = q.isRequired,
            showWhen = q.showWhen?.let { runCatching { objectMapper.readValue(it, Any::class.java) }.getOrNull() },
            repeat = q.repeat,
            parentQuestionId = q.parentQuestionId,
            displayOrder = q.displayOrder
        )
    }
}

data class SegmentDto(
    val id: UUID,
    val axis: String,
    val code: String,
    val label: String
) {
    companion object {
        fun from(s: com.sentbe.arc.domain.Segment) = SegmentDto(
            id = s.id, axis = s.axis, code = s.code, label = s.label
        )
    }
}

data class DocTemplateDto(
    val id: UUID,
    val type: String,
    val displayName: String,
    val classification: String,
    val ownerSegmentId: UUID?,
    val isRequired: Boolean,
    val guide: String?
) {
    companion object {
        fun from(t: com.sentbe.arc.domain.DocTemplate) = DocTemplateDto(
            id = t.id,
            type = t.type,
            displayName = t.displayName,
            classification = t.classification,
            ownerSegmentId = t.ownerSegmentId,
            isRequired = t.isRequired,
            guide = t.guide
        )
    }
}

data class RevisionRequestDto(
    val id: java.util.UUID,
    val documentId: java.util.UUID,
    val reason: String,
    val requestedByStaffId: java.util.UUID,
    val requestedFromStatus: String,
    val requestedAt: java.time.OffsetDateTime,
    val resolvedAt: java.time.OffsetDateTime?
) {
    companion object {
        fun from(r: com.sentbe.arc.domain.RevisionRequest) = RevisionRequestDto(
            id = r.id,
            documentId = r.documentId,
            reason = r.reason,
            requestedByStaffId = r.requestedByStaffId,
            requestedFromStatus = r.requestedFromStatus,
            requestedAt = r.requestedAt,
            resolvedAt = r.resolvedAt
        )
    }
}

data class DocumentFileDto(
    val id: java.util.UUID,
    val documentId: java.util.UUID,
    val fileName: String,
    val fileSize: Int,
    val mimeType: String,
    val storageKey: String,
    val uploaderType: String,
    val isLatest: Boolean,
    val uploadedAt: java.time.OffsetDateTime
) {
    companion object {
        fun from(f: com.sentbe.arc.domain.DocumentFile) = DocumentFileDto(
            id = f.id,
            documentId = f.documentId,
            fileName = f.fileName,
            fileSize = f.fileSize,
            mimeType = f.mimeType,
            storageKey = f.storageKey,
            uploaderType = f.uploaderType,
            isLatest = f.isLatest,
            uploadedAt = f.uploadedAt
        )
    }
}

data class ActiveRulesResponse(
    val segments: List<SegmentDto>,
    val firstQuestions: List<QuestionDto>,
    val docTemplates: List<DocTemplateDto>
) {
    companion object {
        fun from(rules: ActiveRules, objectMapper: ObjectMapper) = ActiveRulesResponse(
            segments = rules.segments.map { SegmentDto.from(it) },
            firstQuestions = rules.firstQuestions.map { QuestionDto.from(it, objectMapper) },
            docTemplates = rules.docTemplates.map { DocTemplateDto.from(it) }
        )
    }
}
