package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "case_event")
class CaseEvent {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "case_id", nullable = false)
    var caseId: UUID = UUID.randomUUID()

    @Column(name = "event_type", nullable = false)
    var eventType: String = ""

    @Column(name = "actor_type", nullable = false)
    var actorType: String = ""

    @Column(name = "actor_id")
    var actorId: UUID? = null

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    var payload: String = "{}"

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()
}
