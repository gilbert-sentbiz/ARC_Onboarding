package com.sentbe.arc.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.sentbe.arc.api.dto.ActiveRulesResponse
import com.sentbe.arc.service.CaseService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/** GET /rules/active — 현재 활성 룰 조회 (1차 질문 렌더용) */
@RestController
@RequestMapping("/rules")
class RulesController(
    private val caseService: CaseService,
    private val objectMapper: ObjectMapper
) {
    @GetMapping("/active")
    fun getActiveRules(): ActiveRulesResponse {
        val rules = caseService.getActiveRules()
        return ActiveRulesResponse.from(rules, objectMapper)
    }
}
