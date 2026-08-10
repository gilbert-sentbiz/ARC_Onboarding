package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "intake_response")
class IntakeResponse {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "case_id", nullable = false)
    var caseId: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var phase: String = ""

    @Column(nullable = false)
    var status: String = "not_started"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    var answers: String = "{}"

    @Column(name = "saved_at", nullable = false)
    var savedAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "submitted_at")
    var submittedAt: OffsetDateTime? = null
}
