package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "revision_request")
class RevisionRequest {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "document_id", nullable = false)
    var documentId: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var reason: String = ""

    @Column(name = "requested_by_staff_id", nullable = false)
    var requestedByStaffId: UUID = UUID.randomUUID()

    @Column(name = "requested_from_status", nullable = false)
    var requestedFromStatus: String = ""

    @Column(name = "requested_at", nullable = false, updatable = false)
    var requestedAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "resolved_at")
    var resolvedAt: OffsetDateTime? = null
}
