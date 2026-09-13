package com.apex.banking.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apex.banking.ui.theme.ApexCyan
import com.apex.banking.ui.theme.ApexGold
import com.apex.banking.ui.theme.ApexNavyBorder
import com.apex.banking.ui.theme.ApexNavyCard
import com.apex.banking.ui.theme.ApexNavyDark
import com.apex.banking.ui.theme.ApexTextMuted
import com.apex.banking.ui.theme.ApexTextPrimary
import com.apex.banking.ui.theme.ApexTextSecondary

@Composable
fun MaintenanceScreen(
    onRefreshClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ApexNavyDark)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(ApexGold.copy(alpha = 0.15f))
                    .border(2.dp, ApexGold.copy(alpha = 0.5f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.WarningAmber,
                    contentDescription = "Maintenance",
                    tint = ApexGold,
                    modifier = Modifier.size(44.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "SYSTEM UPGRADE IN PROGRESS",
                color = ApexTextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Apex Digital Banking is undergoing scheduled infrastructure enhancements to maintain banking resilience. Client accounts and automated settlements remain fully secured.",
                color = ApexTextSecondary,
                fontSize = 13.sp,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(ApexNavyCard)
                    .border(1.dp, ApexNavyBorder, RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "CIRCUIT BREAKER ACTIVATED",
                            color = ApexGold,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Flag: platform.network.maintenance-mode = ENABLED",
                        color = ApexTextMuted,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = onRefreshClick,
                colors = ButtonDefaults.buttonColors(containerColor = ApexCyan),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Check System Status",
                    color = ApexNavyDark,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
