package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "doc_template")
class DocTemplate {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var type: String = ""

    @Column(name = "display_name", nullable = false)
    var displayName: String = ""

    @Column(nullable = false)
    var classification: String = ""

    @Column(name = "owner_segment_id")
    var ownerSegmentId: UUID? = null

    @Column(name = "is_required", nullable = false)
    var isRequired: Boolean = true

    @Column(name = "is_conditional", nullable = false)
    var isConditional: Boolean = false

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var condition: String? = null

    var guide: String? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "deactivated_at")
    var deactivatedAt: OffsetDateTime? = null
}
