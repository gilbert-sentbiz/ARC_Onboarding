package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "customer")
class Customer {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(nullable = false, unique = true)
    var email: String = ""

    @Column(name = "auth_method", nullable = false)
    var authMethod: String = "otp"

    @Column(name = "password_hash")
    var passwordHash: String? = null

    @Column(name = "business_reg_no")
    var businessRegNo: String? = null

    @Column(name = "company_name")
    var companyName: String? = null

    @Column(name = "contact_name")
    var contactName: String? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now()
}
