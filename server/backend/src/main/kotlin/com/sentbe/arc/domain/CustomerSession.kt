package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "customer_session")
class CustomerSession {
    @Id var id: UUID = UUID.randomUUID()
    @Column(name = "customer_id", nullable = false) var customerId: UUID = UUID.randomUUID()
    @Column(nullable = false, unique = true) var token: String = ""
    @Column(name = "expires_at", nullable = false) var expiresAt: OffsetDateTime = OffsetDateTime.now()
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: OffsetDateTime = OffsetDateTime.now()
}
