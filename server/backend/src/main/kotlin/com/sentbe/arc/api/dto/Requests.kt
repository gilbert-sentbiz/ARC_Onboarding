package com.sentbe.arc.api.dto

// 케이스 생성 — 이메일은 인증된 세션에서 자동 참조
data class CreateCaseRequest(
    val companyName: String? = null,
    val contactName: String? = null,
    val firstIntakeAnswers: Map<String, Any> = emptyMap()
)

data class SubmitIntakeRequest(
    val answers: Map<String, Any> = emptyMap()
)

data class TransitionRequest(
    val targetStatus: String,
    val reason: String? = null
)
