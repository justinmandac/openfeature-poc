package com.apex.banking.data.repository

import android.util.Log
import com.apex.banking.data.model.UserPersona
import com.apex.banking.data.provider.ApexOfrepFeatureProvider
import dev.openfeature.sdk.Client
import dev.openfeature.sdk.ImmutableContext
import dev.openfeature.sdk.OpenFeatureAPI
import dev.openfeature.sdk.Value
import dev.openfeature.sdk.events.OpenFeatureProviderEvents
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

object FeatureFlagRepository {
    private const val TAG = "FeatureFlagRepository"
    private val scope = CoroutineScope(Dispatchers.IO + Job())

    val provider = ApexOfrepFeatureProvider()
    private lateinit var client: Client

    private val _currentPersona = MutableStateFlow(UserPersona.DEFAULT)
    val currentPersona: StateFlow<UserPersona> = _currentPersona.asStateFlow()

    private val _gatewayUrl = MutableStateFlow(provider.baseUrl)
    val gatewayUrl: StateFlow<String> = _gatewayUrl.asStateFlow()

    // Flag StateFlows
    private val _biometricFreezeEnabled = MutableStateFlow(false)
    val biometricFreezeEnabled: StateFlow<Boolean> = _biometricFreezeEnabled.asStateFlow()

    private val _travelMultiplier = MutableStateFlow(1)
    val travelMultiplier: StateFlow<Int> = _travelMultiplier.asStateFlow()

    private val _geminiCopilotEnabled = MutableStateFlow(false)
    val geminiCopilotEnabled: StateFlow<Boolean> = _geminiCopilotEnabled.asStateFlow()

    private val _wealthInsightsEnabled = MutableStateFlow(false)
    val wealthInsightsEnabled: StateFlow<Boolean> = _wealthInsightsEnabled.asStateFlow()

    private val _maintenanceModeEnabled = MutableStateFlow(false)
    val maintenanceModeEnabled: StateFlow<Boolean> = _maintenanceModeEnabled.asStateFlow()

    val isSseConnected: StateFlow<Boolean> = provider.sseConnected

    fun initialize() {
        scope.launch {
            try {
                val initialPersona = _currentPersona.value
                val initialContext = createEvaluationContext(initialPersona)

                OpenFeatureAPI.setProvider(provider = provider, initialContext = initialContext)
                client = OpenFeatureAPI.getClient()

                // Observe provider events to refresh flag states
                provider.observe().collect { event ->
                    when (event) {
                        is OpenFeatureProviderEvents.ProviderReady,
                        is OpenFeatureProviderEvents.ProviderConfigurationChanged -> {
                            Log.d(TAG, "Provider event received: $event. Refreshing flag evaluations...")
                            refreshFlagEvaluations()
                        }
                        else -> {}
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing OpenFeature: ${e.message}", e)
            }
        }
    }

    fun setPersona(persona: UserPersona) {
        _currentPersona.value = persona
        scope.launch {
            try {
                val newContext = createEvaluationContext(persona)
                OpenFeatureAPI.setEvaluationContext(newContext)
                refreshFlagEvaluations()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update evaluation context for ${persona.id}: ${e.message}")
            }
        }
    }

    fun setGatewayUrl(url: String) {
        _gatewayUrl.value = url
        scope.launch {
            provider.updateBaseUrl(url)
            refreshFlagEvaluations()
        }
    }

    fun manualRefresh() {
        scope.launch {
            val context = createEvaluationContext(_currentPersona.value)
            provider.evaluateFlags(context)
            refreshFlagEvaluations()
        }
    }

    private fun refreshFlagEvaluations() {
        if (!::client.isInitialized) return

        val biometric = client.getBooleanValue("cards.controls.biometric-freeze", false)
        val multiplier = client.getIntegerValue("cards.rewards.travel-multiplier", 1)
        val copilot = client.getBooleanValue("retail.copilot.gemini-ui", false)
        val wealth = client.getBooleanValue("wealth.advisory.predictive-insights", false)
        val maintenance = client.getBooleanValue("platform.network.maintenance-mode", false)

        Log.i(
            TAG,
            "Flags updated: biometric=$biometric, multiplier=${multiplier}x, copilot=$copilot, wealth=$wealth, maintenance=$maintenance"
        )

        _biometricFreezeEnabled.value = biometric
        _travelMultiplier.value = multiplier
        _geminiCopilotEnabled.value = copilot
        _wealthInsightsEnabled.value = wealth
        _maintenanceModeEnabled.value = maintenance
    }

    private fun createEvaluationContext(persona: UserPersona): ImmutableContext {
        val attributes = mapOf(
            "userTier" to Value.String(persona.tier),
            "country" to Value.String(persona.country),
            "channel" to Value.String("mobile"),
            "platform" to Value.String("android"),
            "appVersion" to Value.String("2.4.0")
        )
        return ImmutableContext(targetingKey = persona.id, attributes = attributes)
    }
}
