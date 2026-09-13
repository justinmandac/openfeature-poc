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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apex.banking.data.model.UserPersona
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
fun PersonaSelectorBottomSheet(
    sheetState: SheetState,
    currentPersona: UserPersona,
    gatewayUrl: String,
    onSelectPersona: (UserPersona) -> Unit,
    onUpdateGatewayUrl: (String) -> Unit,
    onRefreshFlags: () -> Unit,
    onDismiss: () -> Unit
) {
    var editableUrl by remember { mutableStateOf(gatewayUrl) }

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
                Column {
                    Text(
                        text = "TARGETING CONTEXT & PERSONA",
                        color = ApexCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Select Persona to Test OpenFeature Rules",
                        color = ApexTextSecondary,
                        fontSize = 12.sp
                    )
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

            // Personas list
            UserPersona.ALL.forEach { persona ->
                val isSelected = persona.id == currentPersona.id
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) ApexNavyCard else ApexNavyDark)
                        .border(
                            width = if (isSelected) 1.5.dp else 1.dp,
                            color = if (isSelected) ApexCyan else ApexNavyBorder,
                            shape = RoundedCornerShape(14.dp)
                        )
                        .clickable {
                            onSelectPersona(persona)
                            onDismiss()
                        }
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = persona.flagEmoji, fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = persona.name,
                                        color = ApexTextPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(ApexCyan.copy(alpha = 0.15f))
                                            .padding(horizontal = 5.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = persona.tier,
                                            color = ApexCyan,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                                Text(
                                    text = "${persona.title} • targetingKey: ${persona.id}",
                                    color = ApexTextMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Active",
                                tint = ApexCyan,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Central Feature Gateway Configuration
            Text(
                text = "FEATURE GATEWAY OFREP ENDPOINT",
                color = ApexTextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = editableUrl,
                onValueChange = { editableUrl = it },
                label = { Text("Gateway Base URL", color = ApexTextMuted) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ApexCyan,
                    unfocusedBorderColor = ApexNavyBorder,
                    focusedTextColor = ApexTextPrimary,
                    unfocusedTextColor = ApexTextPrimary,
                    focusedContainerColor = ApexNavyCard,
                    unfocusedContainerColor = ApexNavyCard
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = {
                        onUpdateGatewayUrl(editableUrl)
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ApexCyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Apply Endpoint",
                        color = ApexNavyDark,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = {
                        onRefreshFlags()
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ApexNavyCard),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.border(1.dp, ApexNavyBorder, RoundedCornerShape(10.dp))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = ApexTextPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Sync",
                            color = ApexTextPrimary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
