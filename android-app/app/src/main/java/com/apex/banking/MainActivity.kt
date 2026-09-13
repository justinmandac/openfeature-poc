package com.apex.banking

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import com.apex.banking.ui.components.CopilotBottomSheet
import com.apex.banking.ui.components.CreditCardSection
import com.apex.banking.ui.components.HeaderBar
import com.apex.banking.ui.components.MaintenanceScreen
import com.apex.banking.ui.components.PersonaSelectorBottomSheet
import com.apex.banking.ui.components.QuickActionsSection
import com.apex.banking.ui.components.WealthAdvisorySection
import com.apex.banking.ui.theme.ApexBankingTheme
import com.apex.banking.ui.theme.ApexCyan
import com.apex.banking.ui.theme.ApexEmerald
import com.apex.banking.ui.theme.ApexNavyDark
import com.apex.banking.ui.viewmodel.BankingViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: BankingViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ApexBankingTheme {
                BankingApp(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BankingApp(viewModel: BankingViewModel) {
    val currentPersona by viewModel.currentPersona.collectAsState()
    val gatewayUrl by viewModel.gatewayUrl.collectAsState()
    val isSseConnected by viewModel.isSseConnected.collectAsState()

    val biometricFreezeEnabled by viewModel.biometricFreezeEnabled.collectAsState()
    val travelMultiplier by viewModel.travelMultiplier.collectAsState()
    val geminiCopilotEnabled by viewModel.geminiCopilotEnabled.collectAsState()
    val wealthInsightsEnabled by viewModel.wealthInsightsEnabled.collectAsState()
    val maintenanceModeEnabled by viewModel.maintenanceModeEnabled.collectAsState()

    val isCardFrozen by viewModel.isCardFrozen.collectAsState()
    val isBiometricScanning by viewModel.isBiometricScanning.collectAsState()

    val showCopilotSheet by viewModel.showCopilotSheet.collectAsState()
    val showPersonaSheet by viewModel.showPersonaSheet.collectAsState()

    val copilotSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val personaSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    if (maintenanceModeEnabled) {
        MaintenanceScreen(
            onRefreshClick = { viewModel.refreshFlags() }
        )
    } else {
        Scaffold(
            containerColor = ApexNavyDark,
            topBar = {
                HeaderBar(
                    persona = currentPersona,
                    isSseConnected = isSseConnected,
                    onPersonaClick = { viewModel.setPersonaSheetVisible(true) },
                    onRefreshClick = { viewModel.refreshFlags() }
                )
            },
            floatingActionButton = {
                // OpenFeature Flag: retail.copilot.gemini-ui
                AnimatedVisibility(
                    visible = geminiCopilotEnabled,
                    enter = scaleIn(),
                    exit = scaleOut()
                ) {
                    FloatingActionButton(
                        onClick = { viewModel.setCopilotSheetVisible(true) },
                        containerColor = ApexCyan,
                        contentColor = ApexNavyDark,
                        shape = CircleShape,
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(listOf(ApexCyan, ApexEmerald))
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Gemini Copilot",
                            tint = ApexNavyDark,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(ApexNavyDark)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                ) {
                    CreditCardSection(
                        persona = currentPersona,
                        travelMultiplier = travelMultiplier,
                        biometricFreezeEnabled = biometricFreezeEnabled,
                        isCardFrozen = isCardFrozen,
                        isBiometricScanning = isBiometricScanning,
                        onToggleFreeze = { viewModel.toggleCardFreeze() }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    QuickActionsSection()

                    WealthAdvisorySection(isEnabled = wealthInsightsEnabled)

                    Spacer(modifier = Modifier.height(80.dp)) // padding for FAB
                }
            }
        }
    }

    if (showCopilotSheet) {
        CopilotBottomSheet(
            sheetState = copilotSheetState,
            onDismiss = { viewModel.setCopilotSheetVisible(false) }
        )
    }

    if (showPersonaSheet) {
        PersonaSelectorBottomSheet(
            sheetState = personaSheetState,
            currentPersona = currentPersona,
            gatewayUrl = gatewayUrl,
            onSelectPersona = { viewModel.switchPersona(it) },
            onUpdateGatewayUrl = { viewModel.updateGatewayUrl(it) },
            onRefreshFlags = { viewModel.refreshFlags() },
            onDismiss = { viewModel.setPersonaSheetVisible(false) }
        )
    }
}
