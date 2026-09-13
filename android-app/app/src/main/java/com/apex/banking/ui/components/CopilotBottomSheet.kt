package com.apex.banking.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apex.banking.ui.theme.ApexCyan
import com.apex.banking.ui.theme.ApexEmerald
import com.apex.banking.ui.theme.ApexNavyBorder
import com.apex.banking.ui.theme.ApexNavyCard
import com.apex.banking.ui.theme.ApexNavyDark
import com.apex.banking.ui.theme.ApexTextMuted
import com.apex.banking.ui.theme.ApexTextPrimary
import com.apex.banking.ui.theme.ApexTextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CopilotBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit
) {
    var userPrompt by remember { mutableStateOf("") }
    var chatMessage by remember {
        mutableStateOf(
            "Hello Alexander. I'm your Apex Gemini Financial Copilot. Your 3x Travel Points multiplier is currently active for all international dining and airline bookings this month. How may I assist your portfolio today?"
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = ApexNavyDark,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .size(36.dp, 4.dp)
                    .clip(CircleShape)
                    .background(ApexNavyBorder)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(listOf(ApexCyan, ApexEmerald))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Gemini AI",
                            tint = ApexNavyDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Apex Copilot",
                                color = ApexTextPrimary,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(ApexCyan.copy(alpha = 0.2f))
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "GEMINI PRO",
                                    color = ApexCyan,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Text(
                            text = "Flag: retail.copilot.gemini-ui (ENABLED)",
                            color = ApexTextMuted,
                            fontSize = 11.sp
                        )
                    }
                }

                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = ApexTextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // AI Response Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(ApexNavyCard)
                    .border(1.dp, ApexNavyBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Text(
                    text = chatMessage,
                    color = ApexTextPrimary,
                    fontSize = 13.sp,
                    lineHeight = 20.sp
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Prompt Chips
            Text(
                text = "SUGGESTED GENERATIVE ACTIONS",
                color = ApexTextMuted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PromptChip(
                    text = "📊 Analyze Travel Multiplier",
                    onClick = {
                        chatMessage = "Analyzing rewards: You have accumulated 42,800 points this cycle. With the Premier 3x Travel Multiplier enabled, your next overseas flight redemption is 100% covered."
                    }
                )
                PromptChip(
                    text = "🔒 Biometric Freeze Info",
                    onClick = {
                        chatMessage = "The Biometric Card Freeze feature is active on your profile. Any instant freeze immediately halts NFC, online CNP, and ATM authorizations in real-time."
                    }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Text Input Field
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = userPrompt,
                    onValueChange = { userPrompt = it },
                    placeholder = {
                        Text(
                            text = "Ask Apex Copilot anything...",
                            color = ApexTextMuted,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ApexCyan,
                        unfocusedBorderColor = ApexNavyBorder,
                        focusedTextColor = ApexTextPrimary,
                        unfocusedTextColor = ApexTextPrimary,
                        focusedContainerColor = ApexNavyCard,
                        unfocusedContainerColor = ApexNavyCard
                    ),
                    maxLines = 2
                )

                Spacer(modifier = Modifier.width(8.dp))

                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            if (userPrompt.isNotBlank())
                                Brush.linearGradient(listOf(ApexCyan, ApexEmerald))
                            else
                                Brush.linearGradient(listOf(ApexNavyCard, ApexNavyCard))
                        )
                        .clickable(enabled = userPrompt.isNotBlank()) {
                            chatMessage = "Processed request: \"$userPrompt\". Gemini simulated reasoning indicates your accounts are fully optimized."
                            userPrompt = ""
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send",
                        tint = if (userPrompt.isNotBlank()) ApexNavyDark else ApexTextMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun PromptChip(
    text: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(ApexNavyCard)
            .border(1.dp, ApexNavyBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        Text(
            text = text,
            color = ApexCyan,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
