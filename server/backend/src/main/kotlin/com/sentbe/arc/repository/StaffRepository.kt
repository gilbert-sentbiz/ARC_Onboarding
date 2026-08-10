package com.sentbe.arc.repository

import com.sentbe.arc.domain.Staff
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface StaffRepository : JpaRepository<Staff, UUID> {
    fun findByEmailAndIsActiveTrue(email: String): Staff?
}
