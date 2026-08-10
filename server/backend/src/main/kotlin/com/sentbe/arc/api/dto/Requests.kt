package com.sentbe.arc.api.dto

data class CreateCaseRequest(
    val email: String,
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
