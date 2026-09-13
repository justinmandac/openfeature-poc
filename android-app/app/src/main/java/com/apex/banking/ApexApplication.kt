package com.apex.banking

import android.app.Application
import android.util.Log
import com.apex.banking.data.repository.FeatureFlagRepository

class ApexApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("ApexApplication", "Starting Apex Mobile Banking Application")
        FeatureFlagRepository.initialize()
    }
}
