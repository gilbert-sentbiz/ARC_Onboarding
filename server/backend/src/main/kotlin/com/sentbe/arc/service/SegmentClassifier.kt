package com.sentbe.arc.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.repository.QuestionRepository
import com.sentbe.arc.repository.SegmentRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.UUID

@Service
class SegmentClassifier(
    private val segmentRepository: SegmentRepository,
    private val questionRepository: QuestionRepository,
    private val objectMapper: ObjectMapper
) {
    // classification_trigger.conditions[].field → question.code 매핑
    private val fieldToCode = mapOf(
        "businessType" to "fi_business_type",
        "foundingCountry" to "fi_founding_country",
        "services" to "fi_services"
    )

    data class Result(
        val entityCode: String?,
        val services: List<String>,
        val segmentMeta: Map<String, Any>
    )

    /**
     * 1차 설문 응답을 segment.classification_trigger에 대입해 분류 결과를 반환.
     * pinnedFirstIds = pinned_question_ids.first 목록 (케이스 생성 시 고정된 질문 ID).
     */
    @Suppress("UNCHECKED_CAST")
    fun classify(
        answers: Map<String, Any>,
        pinnedFirstIds: List<UUID>
    ): Result {
        val pinnedQuestions = questionRepository.findByIdIn(pinnedFirstIds)
        val codeToId: Map<String, UUID> = pinnedQuestions.associate { it.code to it.id }

        val activeSegments = segmentRepository.findAllActive()
        val entityMatches = mutableListOf<Pair<Int, String>>() // (priority, code)
        val serviceCodes = mutableListOf<String>()

        for (segment in activeSegments) {
            val triggerJson = segment.classificationTrigger ?: continue
            val rules = objectMapper.readValue(triggerJson, List::class.java) as List<Map<String, Any>>

            val matches = rules.any { rule ->
                val logic = rule["logic"] as? String ?: "AND"
                val conditions = rule["conditions"] as List<Map<String, Any>>
                val priority = (rule["priority"] as? Number)?.toInt() ?: 99

                val conditionsMet = when (logic) {
                    "OR" -> conditions.any { evaluateCondition(it, answers, codeToId) }
                    else -> conditions.all { evaluateCondition(it, answers, codeToId) }
                }

                if (conditionsMet && segment.axis == "entity") {
                    entityMatches.add(priority to segment.code)
                }
                conditionsMet
            }

            if (matches && segment.axis == "service") {
                serviceCodes.add(segment.code)
            }
        }

        val entityCode = entityMatches.minByOrNull { it.first }?.second

        val meta = mapOf(
            "entityCode" to (entityCode ?: ""),
            "services" to serviceCodes,
            "classifiedAt" to OffsetDateTime.now().toString(),
            "inputSnapshot" to answers
        )

        return Result(entityCode = entityCode, services = serviceCodes, segmentMeta = meta)
    }

    @Suppress("UNCHECKED_CAST")
    private fun evaluateCondition(
        condition: Map<String, Any>,
        answers: Map<String, Any>,
        codeToId: Map<String, UUID>
    ): Boolean {
        val field = condition["field"] as? String ?: return false
        val op = condition["op"] as? String ?: return false
        val expected = condition["value"] as? String ?: return false

        val questionCode = fieldToCode[field] ?: return false
        val questionId = codeToId[questionCode] ?: return false
        val answer = answers[questionId.toString()] ?: return false

        return when (op) {
            "eq" -> answer.toString() == expected
            "contains" -> when (answer) {
                is List<*> -> answer.contains(expected)
                is String -> answer == expected || answer.contains(expected)
                else -> false
            }
            else -> false
        }
    }
}
