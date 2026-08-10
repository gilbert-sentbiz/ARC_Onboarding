package com.sentbe.arc.repository

import com.sentbe.arc.domain.Question
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface QuestionRepository : JpaRepository<Question, UUID> {
    @Query("SELECT q FROM Question q WHERE q.phase = :phase AND q.deactivatedAt IS NULL ORDER BY q.displayOrder")
    fun findActiveByPhase(phase: String): List<Question>

    @Query("""
        SELECT q FROM Question q WHERE q.phase = 'second' AND q.deactivatedAt IS NULL
        AND (q.classification = 'common' OR q.ownerSegmentId = :segmentId)
        ORDER BY q.displayOrder
    """)
    fun findActiveSecondPhaseFor(segmentId: UUID): List<Question>

    fun findByCodeAndDeactivatedAtIsNull(code: String): Question?

    @Query("SELECT q FROM Question q WHERE q.id IN :ids ORDER BY q.displayOrder")
    fun findByIdIn(ids: List<UUID>): List<Question>
}
