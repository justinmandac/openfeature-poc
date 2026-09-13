package com.apex.banking.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserPersona(
    val id: String,
    val name: String,
    val title: String,
    val country: String,
    val flagEmoji: String,
    val tier: String,
    val balanceFormatted: String,
    val cardNumberMasked: String = "•••• •••• •••• 8842",
    val cardExpiry: String = "08/29"
) {
    companion object {
        val ALL = listOf(
            UserPersona(
                id = "user-sg-vip",
                name = "Alexander Wright",
                title = "Apex Premier Wealth",
                country = "SG",
                flagEmoji = "🇸🇬",
                tier = "PREMIUM",
                balanceFormatted = "S$ 2,458,920.00"
            ),
            UserPersona(
                id = "user-my-retail",
                name = "Siti Nurhaliza",
                title = "Apex Everyday Banking",
                country = "MY",
                flagEmoji = "🇲🇾",
                tier = "STANDARD",
                balanceFormatted = "RM 14,850.50"
            ),
            UserPersona(
                id = "user-global-beta",
                name = "David Miller",
                title = "Apex Global Explorer (Beta)",
                country = "US",
                flagEmoji = "🇺🇸",
                tier = "BETA",
                balanceFormatted = "$ 68,400.00"
            )
        )

        val DEFAULT = ALL.first()
    }
}
