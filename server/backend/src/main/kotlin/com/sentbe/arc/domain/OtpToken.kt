package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "otp_token")
class OtpToken {
    @Id var id: UUID = UUID.randomUUID()
    @Column(nullable = false) var email: String = ""
    @Column(nullable = false) var code: String = ""
    @Column(name = "expires_at", nullable = false) var expiresAt: OffsetDateTime = OffsetDateTime.now()
    @Column(name = "used_at") var usedAt: OffsetDateTime? = null
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: OffsetDateTime = OffsetDateTime.now()
}
