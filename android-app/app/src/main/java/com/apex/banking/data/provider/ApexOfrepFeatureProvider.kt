package com.apex.banking.data.provider

import android.util.Log
import com.apex.banking.data.model.OfrepEvaluationRequest
import com.apex.banking.data.model.OfrepEvaluationResponse
import com.apex.banking.data.model.OfrepFlagResult
import dev.openfeature.sdk.EvaluationContext
import dev.openfeature.sdk.FeatureProvider
import dev.openfeature.sdk.Hook
import dev.openfeature.sdk.ProviderEvaluation
import dev.openfeature.sdk.ProviderMetadata
import dev.openfeature.sdk.Reason
import dev.openfeature.sdk.Value
import dev.openfeature.sdk.events.OpenFeatureProviderEvents
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.intOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class ApexOfrepFeatureProvider(
    var baseUrl: String = "http://10.0.2.2:4003"
) : FeatureProvider {

    companion object {
        private const val TAG = "ApexOfrepProvider"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private val evaluatedFlags = ConcurrentHashMap<String, OfrepFlagResult>()
    private var lastETag: String? = null
    private var sseEventSource: EventSource? = null

    private var currentContext: EvaluationContext? = null

    private val _eventsFlow = MutableSharedFlow<OpenFeatureProviderEvents>(extraBufferCapacity = 64)
    private val _sseConnected = MutableStateFlow(false)
    val sseConnected: StateFlow<Boolean> = _sseConnected.asStateFlow()

    override val hooks: List<Hook<*>> = emptyList()

    override val metadata: ProviderMetadata = object : ProviderMetadata {
        override val name: String = "ApexOfrepFeatureProvider"
    }

    override fun observe(): Flow<OpenFeatureProviderEvents> = _eventsFlow.asSharedFlow()

    override suspend fun initialize(initialContext: EvaluationContext?) {
        Log.i(TAG, "Initializing ApexOfrepFeatureProvider with baseUrl: $baseUrl")
        currentContext = initialContext
        evaluateFlags(initialContext)
        startSseStream()
        _eventsFlow.emit(OpenFeatureProviderEvents.ProviderReady)
    }

    override fun shutdown() {
        Log.i(TAG, "Shutting down ApexOfrepFeatureProvider")
        sseEventSource?.cancel()
        sseEventSource = null
        _sseConnected.value = false
    }

    override suspend fun onContextSet(oldContext: EvaluationContext?, newContext: EvaluationContext) {
        Log.i(TAG, "Context updated to: ${newContext.getTargetingKey()}")
        currentContext = newContext
        evaluateFlags(newContext)
    }

    suspend fun updateBaseUrl(newUrl: String) {
        if (baseUrl != newUrl) {
            baseUrl = newUrl.trimEnd('/')
            lastETag = null
            sseEventSource?.cancel()
            evaluateFlags(currentContext)
            startSseStream()
        }
    }

    suspend fun evaluateFlags(context: EvaluationContext?) {
        try {
            val contextMap = mutableMapOf<String, JsonElement>()

            if (context != null) {
                val key = context.getTargetingKey()
                if (key.isNotBlank()) {
                    contextMap["targetingKey"] = JsonPrimitive(key)
                }
                for ((attrKey, attrVal) in context.asMap()) {
                    contextMap[attrKey] = valueToJsonElement(attrVal)
                }
            }

            if (!contextMap.containsKey("channel")) {
                contextMap["channel"] = JsonPrimitive("mobile")
            }
            if (!contextMap.containsKey("platform")) {
                contextMap["platform"] = JsonPrimitive("android")
            }
            if (!contextMap.containsKey("appId")) {
                contextMap["appId"] = JsonPrimitive("android-app")
            }
            if (!contextMap.containsKey("callerApp")) {
                contextMap["callerApp"] = JsonPrimitive("android-app")
            }

            val requestPayload = OfrepEvaluationRequest(context = contextMap)
            val jsonBody = json.encodeToString(OfrepEvaluationRequest.serializer(), requestPayload)

            val requestBuilder = Request.Builder()
                .url("$baseUrl/ofrep/v1/evaluate/flags?channel=mobile&appTag=android-app&appId=android-app")
                .header("X-Client-App", "android-app")
                .header("X-Channel", "mobile")
                .post(jsonBody.toRequestBody(JSON_MEDIA_TYPE))

            val actorKey = context?.getTargetingKey()
            if (!actorKey.isNullOrBlank()) {
                requestBuilder.header("X-Actor", actorKey)
            }

            lastETag?.let {
                requestBuilder.header("If-None-Match", it)
            }

            val request = requestBuilder.build()
            val response: Response = okHttpClient.newCall(request).execute()

            response.use { resp ->
                if (resp.code == 304) {
                    Log.d(TAG, "OFREP cache validated (304 Not Modified). Retaining ${evaluatedFlags.size} flags.")
                    return
                }

                if (!resp.isSuccessful) {
                    Log.w(TAG, "OFREP evaluation failed with HTTP ${resp.code}: ${resp.message}")
                    return
                }

                val eTag = resp.header("ETag")
                if (!eTag.isNullOrBlank()) {
                    lastETag = eTag
                }

                val bodyString = resp.body?.string().orEmpty()
                val parsed = json.decodeFromString(OfrepEvaluationResponse.serializer(), bodyString)

                evaluatedFlags.clear()
                for (flag in parsed.flags) {
                    evaluatedFlags[flag.key] = flag
                }

                Log.i(TAG, "Evaluated ${evaluatedFlags.size} flags via OFREP")
                _eventsFlow.emit(OpenFeatureProviderEvents.ProviderConfigurationChanged)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error evaluating OFREP flags: ${e.message}", e)
        }
    }

    fun startSseStream() {
        sseEventSource?.cancel()
        val sseUrl = "$baseUrl/api/v1/events/flags"
        Log.i(TAG, "Subscribing to Feature Gateway SSE stream: $sseUrl")

        val sseRequest = Request.Builder()
            .url(sseUrl)
            .header("Accept", "text/event-stream")
            .build()

        sseEventSource = EventSources.createFactory(okHttpClient)
            .newEventSource(sseRequest, object : EventSourceListener() {
                override fun onOpen(eventSource: EventSource, response: Response) {
                    Log.i(TAG, "SSE connected to Feature Gateway")
                    _sseConnected.value = true
                }

                override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                    Log.d(TAG, "SSE event received: type=$type, data=$data")
                    // If flag changed or configuration changed, refresh evaluation
                    scope.launch {
                        lastETag = null // Invalidate cache on live event
                        evaluateFlags(currentContext)
                    }
                }

                override fun onClosed(eventSource: EventSource) {
                    Log.w(TAG, "SSE stream closed. Reconnecting in 3s...")
                    _sseConnected.value = false
                    scope.launch {
                        delay(3000)
                        startSseStream()
                    }
                }

                override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                    Log.w(TAG, "SSE stream error: ${t?.message}. Reconnecting in 3s...")
                    _sseConnected.value = false
                    scope.launch {
                        delay(3000)
                        startSseStream()
                    }
                }
            })
    }

    override fun getBooleanEvaluation(
        key: String,
        defaultValue: Boolean,
        context: EvaluationContext?
    ): ProviderEvaluation<Boolean> {
        val flag = evaluatedFlags[key] ?: return ProviderEvaluation(defaultValue, reason = Reason.DEFAULT.name)
        val value = flag.value.let {
            if (it is JsonPrimitive) it.booleanOrNull ?: defaultValue else defaultValue
        }
        return ProviderEvaluation(
            value = value,
            variant = flag.variant,
            reason = flag.reason ?: Reason.TARGETING_MATCH.name
        )
    }

    override fun getStringEvaluation(
        key: String,
        defaultValue: String,
        context: EvaluationContext?
    ): ProviderEvaluation<String> {
        val flag = evaluatedFlags[key] ?: return ProviderEvaluation(defaultValue, reason = Reason.DEFAULT.name)
        val value = flag.value.let {
            if (it is JsonPrimitive) it.content else defaultValue
        }
        return ProviderEvaluation(
            value = value,
            variant = flag.variant,
            reason = flag.reason ?: Reason.TARGETING_MATCH.name
        )
    }

    override fun getIntegerEvaluation(
        key: String,
        defaultValue: Int,
        context: EvaluationContext?
    ): ProviderEvaluation<Int> {
        val flag = evaluatedFlags[key] ?: return ProviderEvaluation(defaultValue, reason = Reason.DEFAULT.name)
        val value = flag.value.let {
            if (it is JsonPrimitive) it.intOrNull ?: defaultValue else defaultValue
        }
        return ProviderEvaluation(
            value = value,
            variant = flag.variant,
            reason = flag.reason ?: Reason.TARGETING_MATCH.name
        )
    }

    override fun getDoubleEvaluation(
        key: String,
        defaultValue: Double,
        context: EvaluationContext?
    ): ProviderEvaluation<Double> {
        val flag = evaluatedFlags[key] ?: return ProviderEvaluation(defaultValue, reason = Reason.DEFAULT.name)
        val value = flag.value.let {
            if (it is JsonPrimitive) it.doubleOrNull ?: defaultValue else defaultValue
        }
        return ProviderEvaluation(
            value = value,
            variant = flag.variant,
            reason = flag.reason ?: Reason.TARGETING_MATCH.name
        )
    }

    override fun getObjectEvaluation(
        key: String,
        defaultValue: Value,
        context: EvaluationContext?
    ): ProviderEvaluation<Value> {
        val flag = evaluatedFlags[key] ?: return ProviderEvaluation(defaultValue, reason = Reason.DEFAULT.name)
        val converted = jsonElementToValue(flag.value)
        return ProviderEvaluation(
            value = converted,
            variant = flag.variant,
            reason = flag.reason ?: Reason.TARGETING_MATCH.name
        )
    }

    private fun valueToJsonElement(value: Value): JsonElement {
        return when (value) {
            is Value.Boolean -> JsonPrimitive(value.boolean)
            is Value.String -> JsonPrimitive(value.string)
            is Value.Integer -> JsonPrimitive(value.integer)
            is Value.Double -> JsonPrimitive(value.double)
            is Value.List -> JsonArray(value.list.map { valueToJsonElement(it) })
            is Value.Structure -> JsonObject(value.structure.mapValues { valueToJsonElement(it.value) })
            is Value.Null -> JsonNull
            is Value.Date -> JsonPrimitive(value.date.time)
        }
    }

    private fun jsonElementToValue(element: JsonElement): Value {
        return when (element) {
            is JsonPrimitive -> {
                element.booleanOrNull?.let { return Value.Boolean(it) }
                element.intOrNull?.let { return Value.Integer(it) }
                element.doubleOrNull?.let { return Value.Double(it) }
                Value.String(element.content)
            }
            is JsonArray -> Value.List(element.map { jsonElementToValue(it) })
            is JsonObject -> Value.Structure(element.mapValues { jsonElementToValue(it.value) })
            is JsonNull -> Value.Null
        }
    }
}
