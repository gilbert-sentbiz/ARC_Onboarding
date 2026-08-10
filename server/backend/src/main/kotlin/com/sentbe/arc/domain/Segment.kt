package com.sentbe.arc.domain

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "segment")
class Segment {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(nullable = false)
    var axis: String = ""

    @Column(nullable = false)
    var code: String = ""

    @Column(nullable = false)
    var label: String = ""

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "classification_trigger", columnDefinition = "jsonb")
    var classificationTrigger: String? = null

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "question_overrides", columnDefinition = "jsonb")
    var questionOverrides: String? = null

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "doc_overrides", columnDefinition = "jsonb")
    var docOverrides: String? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()

    @Column(name = "deactivated_at")
    var deactivatedAt: OffsetDateTime? = null
}
