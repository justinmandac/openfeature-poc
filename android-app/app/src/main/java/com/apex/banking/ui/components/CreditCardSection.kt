package com.apex.banking.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apex.banking.data.model.UserPersona
import com.apex.banking.ui.theme.ApexCardMetalGradientEnd
import com.apex.banking.ui.theme.ApexCardMetalGradientStart
import com.apex.banking.ui.theme.ApexCrimson
import com.apex.banking.ui.theme.ApexCyan
import com.apex.banking.ui.theme.ApexEmerald
import com.apex.banking.ui.theme.ApexGold
import com.apex.banking.ui.theme.ApexNavyBorder
import com.apex.banking.ui.theme.ApexNavyCard
import com.apex.banking.ui.theme.ApexTextMuted
import com.apex.banking.ui.theme.ApexTextPrimary
import com.apex.banking.ui.theme.ApexTextSecondary

@Composable
fun CreditCardSection(
    persona: UserPersona,
    travelMultiplier: Int,
    biometricFreezeEnabled: Boolean,
    isCardFrozen: Boolean,
    isBiometricScanning: Boolean,
    onToggleFreeze: () -> Unit
) {
    val cardBorderColor by animateColorAsState(
        targetValue = if (isCardFrozen) ApexCrimson else ApexNavyBorder,
        label = "cardBorderColor"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        // Balance Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column {
                Text(
                    text = "TOTAL AVAILABLE BALANCE",
                    color = ApexTextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = persona.balanceFormatted,
                    color = ApexTextPrimary,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            // Flag-controlled: Rewards Multiplier Badge
            if (travelMultiplier > 1) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(ApexGold.copy(alpha = 0.15f))
                        .border(1.dp, ApexGold.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "⚡",
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${travelMultiplier}x TRAVEL POINTS",
                            color = ApexGold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Virtual Platinum Card Canvas
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(18.dp))
                .border(1.5.dp, cardBorderColor, RoundedCornerShape(18.dp)),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(
                        Brush.linearGradient(
                            listOf(ApexCardMetalGradientStart, ApexCardMetalGradientEnd)
                        )
                    )
                    .padding(20.dp)
            ) {
                // Top Row: Chip & Visa Logo
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Gold EMV Chip
                    Box(
                        modifier = Modifier
                            .size(38.dp, 28.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(ApexGold.copy(alpha = 0.85f))
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (isCardFrozen) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(ApexCrimson.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Frozen",
                                        tint = ApexCrimson,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "FROZEN",
                                        color = ApexCrimson,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                        }

                        Text(
                            text = "VISA",
                            color = ApexTextPrimary,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.SansSerif,
                            letterSpacing = 1.sp
                        )
                    }
                }

                // Middle: Masked Number
                Column(
                    modifier = Modifier.align(Alignment.CenterStart)
                ) {
                    Text(
                        text = persona.cardNumberMasked,
                        color = if (isCardFrozen) ApexTextMuted else ApexTextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 3.sp
                    )
                }

                // Bottom Row: Holder Name & Expiry
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomStart),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Column {
                        Text(
                            text = "CARDHOLDER",
                            color = ApexTextMuted,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = persona.name.uppercase(),
                            color = ApexTextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "EXPIRES",
                            color = ApexTextMuted,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = persona.cardExpiry,
                            color = ApexTextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // OpenFeature Flag: Biometric Card Freeze Control
        AnimatedVisibility(
            visible = biometricFreezeEnabled,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(ApexNavyCard)
                    .border(1.dp, ApexNavyBorder, RoundedCornerShape(14.dp))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isCardFrozen) ApexCrimson.copy(alpha = 0.2f) else ApexEmerald.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isBiometricScanning) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = ApexCyan,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    imageVector = if (isCardFrozen) Icons.Default.Lock else Icons.Default.Fingerprint,
                                    contentDescription = "Biometric Lock",
                                    tint = if (isCardFrozen) ApexCrimson else ApexEmerald,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = if (isCardFrozen) "Card Security Locked" else "Instant Biometric Freeze",
                                    color = ApexTextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(ApexCyan.copy(alpha = 0.2f))
                                        .padding(horizontal = 5.dp, vertical = 1.dp)
                                ) {
                                    Text(
                                        text = "FLAG: ON",
                                        color = ApexCyan,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Text(
                                text = if (isBiometricScanning) "Verifying biometric fingerprint..."
                                else if (isCardFrozen) "Card frozen. Tap switch to unlock."
                                else "Lock card instantly from this device.",
                                color = ApexTextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Switch(
                        checked = isCardFrozen,
                        onCheckedChange = { onToggleFreeze() },
                        enabled = !isBiometricScanning,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = ApexCrimson,
                            checkedTrackColor = ApexCrimson.copy(alpha = 0.3f),
                            uncheckedThumbColor = ApexEmerald,
                            uncheckedTrackColor = ApexEmerald.copy(alpha = 0.3f)
                        )
                    )
                }
            }
        }

        // Fallback when biometricFreezeEnabled is false
        if (!biometricFreezeEnabled) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(ApexNavyCard.copy(alpha = 0.5f))
                    .border(1.dp, ApexNavyBorder, RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = "Call Support",
                        tint = ApexTextMuted,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "To freeze your card, contact Apex 24/7 Support at +65 6800 2000",
                        color = ApexTextMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
