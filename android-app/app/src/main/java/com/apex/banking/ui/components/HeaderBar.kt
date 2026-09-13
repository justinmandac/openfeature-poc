package com.apex.banking.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apex.banking.data.model.UserPersona
import com.apex.banking.ui.theme.ApexCyan
import com.apex.banking.ui.theme.ApexEmerald
import com.apex.banking.ui.theme.ApexNavyBorder
import com.apex.banking.ui.theme.ApexNavyCard
import com.apex.banking.ui.theme.ApexTextMuted
import com.apex.banking.ui.theme.ApexTextPrimary
import com.apex.banking.ui.theme.ApexTextSecondary

@Composable
fun HeaderBar(
    persona: UserPersona,
    isSseConnected: Boolean,
    onPersonaClick: () -> Unit,
    onRefreshClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // App Branding & Title
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "APEX",
                    color = ApexCyan,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "BANKING",
                    color = ApexTextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Light,
                    letterSpacing = 1.sp
                )
            }
            // SSE Live Status Indicator
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 2.dp)
            ) {
                SseLiveDot(isConnected = isSseConnected)
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isSseConnected) "LIVE OFREP STREAM" else "CONNECTING TO GATEWAY",
                    color = if (isSseConnected) ApexEmerald else ApexTextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
            }
        }

        // Persona Chip & Actions
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = onRefreshClick,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refresh Flags",
                    tint = ApexTextSecondary,
                    modifier = Modifier.size(18.dp)
                )
            }

            Spacer(modifier = Modifier.width(4.dp))

            // User Persona Pill Button
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(ApexNavyCard)
                    .border(1.dp, ApexNavyBorder, RoundedCornerShape(20.dp))
                    .clickable { onPersonaClick() }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = persona.flagEmoji,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Column {
                    Text(
                        text = persona.name.split(" ").first(),
                        color = ApexTextPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = persona.tier,
                        color = ApexCyan,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun SseLiveDot(isConnected: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dotPulse"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(10.dp)
    ) {
        if (isConnected) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .background(ApexEmerald.copy(alpha = 0.3f))
            )
        }
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(if (isConnected) ApexEmerald else Color.Gray)
        )
    }
}
