package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "question")
class Question {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var code: String = ""

    @Column(nullable = false)
    var phase: String = ""

    @Column(nullable = false)
    var classification: String = ""

    @Column(name = "owner_segment_id")
    var ownerSegmentId: UUID? = null

    @Column(nullable = false)
    var label: String = ""

    @Column(name = "input_type", nullable = false)
    var inputType: String = ""

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var options: String? = null

    @Column(name = "is_required", nullable = false)
    var isRequired: Boolean = false

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "show_when", columnDefinition = "jsonb")
    var showWhen: String? = null

    @Column(nullable = false)
    var repeat: Boolean = false

    @Column(name = "parent_question_id")
    var parentQuestionId: UUID? = null

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0

    @Column(name = "replaces_question_id")
    var replacesQuestionId: UUID? = null

    @Column(name = "created_by_staff_id")
    var createdByStaffId: UUID? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "deactivated_at")
    var deactivatedAt: OffsetDateTime? = null
}
