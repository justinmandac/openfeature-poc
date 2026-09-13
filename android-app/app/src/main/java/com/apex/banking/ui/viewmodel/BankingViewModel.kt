package com.apex.banking.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apex.banking.data.model.UserPersona
import com.apex.banking.data.repository.FeatureFlagRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BankingViewModel : ViewModel() {

    val currentPersona: StateFlow<UserPersona> = FeatureFlagRepository.currentPersona
    val gatewayUrl: StateFlow<String> = FeatureFlagRepository.gatewayUrl
    val isSseConnected: StateFlow<Boolean> = FeatureFlagRepository.isSseConnected

    // Feature Flags
    val biometricFreezeEnabled: StateFlow<Boolean> = FeatureFlagRepository.biometricFreezeEnabled
    val travelMultiplier: StateFlow<Int> = FeatureFlagRepository.travelMultiplier
    val geminiCopilotEnabled: StateFlow<Boolean> = FeatureFlagRepository.geminiCopilotEnabled
    val wealthInsightsEnabled: StateFlow<Boolean> = FeatureFlagRepository.wealthInsightsEnabled
    val maintenanceModeEnabled: StateFlow<Boolean> = FeatureFlagRepository.maintenanceModeEnabled

    // UI Interactive States
    private val _isCardFrozen = MutableStateFlow(false)
    val isCardFrozen: StateFlow<Boolean> = _isCardFrozen.asStateFlow()

    private val _isBiometricScanning = MutableStateFlow(false)
    val isBiometricScanning: StateFlow<Boolean> = _isBiometricScanning.asStateFlow()

    private val _showCopilotSheet = MutableStateFlow(false)
    val showCopilotSheet: StateFlow<Boolean> = _showCopilotSheet.asStateFlow()

    private val _showPersonaSheet = MutableStateFlow(false)
    val showPersonaSheet: StateFlow<Boolean> = _showPersonaSheet.asStateFlow()

    fun toggleCardFreeze() {
        viewModelScope.launch {
            _isBiometricScanning.value = true
            // Simulate fingerprint scan delay
            delay(900)
            _isBiometricScanning.value = false
            _isCardFrozen.value = !_isCardFrozen.value
        }
    }

    fun switchPersona(persona: UserPersona) {
        FeatureFlagRepository.setPersona(persona)
        _isCardFrozen.value = false // reset lock on persona switch
    }

    fun updateGatewayUrl(newUrl: String) {
        FeatureFlagRepository.setGatewayUrl(newUrl)
    }

    fun refreshFlags() {
        FeatureFlagRepository.manualRefresh()
    }

    fun setCopilotSheetVisible(visible: Boolean) {
        _showCopilotSheet.value = visible
    }

    fun setPersonaSheetVisible(visible: Boolean) {
        _showPersonaSheet.value = visible
    }
}
