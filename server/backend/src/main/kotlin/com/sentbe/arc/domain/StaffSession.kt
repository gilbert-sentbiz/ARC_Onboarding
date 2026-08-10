package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "staff_session")
class StaffSession {
    @Id var id: UUID = UUID.randomUUID()
    @Column(name = "staff_id", nullable = false) var staffId: UUID = UUID.randomUUID()
    @Column(nullable = false, unique = true) var token: String = ""
    @Column(name = "expires_at", nullable = false) var expiresAt: OffsetDateTime = OffsetDateTime.now()
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: OffsetDateTime = OffsetDateTime.now()
}
