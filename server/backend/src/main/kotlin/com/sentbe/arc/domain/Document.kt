package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "document")
class Document {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "case_id", nullable = false)
    var caseId: UUID = UUID.randomUUID()

    @Column(name = "doc_template_id", nullable = false)
    var docTemplateId: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var type: String = ""

    @Column(name = "display_name", nullable = false)
    var displayName: String = ""

    @Column(nullable = false)
    var status: String = "REQUESTED"

    @Column(name = "is_required", nullable = false)
    var isRequired: Boolean = true

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now()
}
