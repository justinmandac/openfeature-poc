package com.apex.banking.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class OfrepEvaluationRequest(
    val context: Map<String, JsonElement>
)

@Serializable
data class OfrepEvaluationResponse(
    val flags: List<OfrepFlagResult> = emptyList()
)

@Serializable
data class OfrepFlagResult(
    val key: String,
    val value: JsonElement,
    val reason: String? = null,
    val variant: String? = null,
    val metadata: JsonObject? = null
)
