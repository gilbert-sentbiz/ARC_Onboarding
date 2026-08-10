package com.sentbe.arc.repository

import com.sentbe.arc.domain.Segment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface SegmentRepository : JpaRepository<Segment, UUID> {
    @Query("SELECT s FROM Segment s WHERE s.deactivatedAt IS NULL")
    fun findAllActive(): List<Segment>

    fun findByCodeAndDeactivatedAtIsNull(code: String): Segment?
}
