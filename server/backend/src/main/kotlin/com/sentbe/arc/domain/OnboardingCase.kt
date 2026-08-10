package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "onboarding_case")
class OnboardingCase {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "customer_id", nullable = false)
    var customerId: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var status: String = "INQUIRY_RECEIVED"

    @Column(name = "close_reason")
    var closeReason: String? = null

    @Column(name = "revision_requested_from")
    var revisionRequestedFrom: String? = null

    @Column(name = "entity_code")
    var entityCode: String? = null

    // text[] — stored as comma-separated, read/write via service layer with native queries
    @Column(name = "services", columnDefinition = "text[]", nullable = false)
    @JdbcTypeCode(SqlTypes.ARRAY)
    var services: Array<String> = emptyArray()

    @Column(name = "sectors", columnDefinition = "text[]", nullable = false)
    @JdbcTypeCode(SqlTypes.ARRAY)
    var sectors: Array<String> = emptyArray()

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "segment_meta", columnDefinition = "jsonb", nullable = false)
    var segmentMeta: String = "{}"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pinned_question_ids", columnDefinition = "jsonb", nullable = false)
    var pinnedQuestionIds: String = "{}"

    @Column(name = "assignee_staff_id")
    var assigneeStaffId: UUID? = null

    @Column(name = "last_customer_action_at")
    var lastCustomerActionAt: OffsetDateTime? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now()
}
