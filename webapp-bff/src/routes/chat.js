const express = require('express');
const router = express.Router();
const { client, trackEvent } = require('../openfeature/client');

/**
 * POST /api/chat
 * Handles financial assistant inquiries with dynamic Generative UI payloads governed by OpenFeature.
 * Uses OpenFeature Transaction Context (AsyncLocalStorage) and emits track events.
 */
router.post('/chat', async (req, res) => {
  try {
    const { message = '' } = req.body;
    const lower = message.toLowerCase().trim();
    const evalContext = req.evalContext;

    // Safe Defaults
    const defaultGeminiUi = false;
    const defaultAdvancedInsights = false;
    const defaultLimits = {
      maxTokens: 300,
      temperature: 0.2,
      rateLimitPerMin: 10,
      allowedTools: ['balance_lookup']
    };

    // Ambient evaluations automatically picking up Transaction Context
    const [geminiUiEnabled, advancedInsightsEnabled, limitsConfig] = await Promise.all([
      client.getBooleanValue('feature.chatbot-gemini-ui', defaultGeminiUi),
      client.getBooleanValue('feature.advanced-financial-insights', defaultAdvancedInsights),
      client.getObjectValue('config.chatbot-limits', defaultLimits)
    ]);

    // Construct response based on user intent and active feature flags
    let textResponse = '';
    let generativeUi = null;
    let intentTracked = 'general_inquiry';

    if (lower.includes('portfolio') || lower.includes('asset') || lower.includes('holdings')) {
      intentTracked = 'portfolio_breakdown_viewed';
      textResponse = 'Here is your current asset allocation breakdown across equities, fixed income, and cash reserves:';
      if (geminiUiEnabled) {
        generativeUi = {
          type: 'portfolio_chart',
          title: 'Total Portfolio: $110,000 USD',
          data: [
            { asset: 'US Equities', value: 45000, percent: 41, color: '#3B82F6' },
            { asset: 'Global Fixed Income', value: 30000, percent: 27, color: '#10B981' },
            { asset: 'Cash & Money Market', value: 25000, percent: 23, color: '#F59E0B' },
            { asset: 'Digital Assets', value: 10000, percent: 9, color: '#8B5CF6' }
          ]
        };
      } else {
        textResponse += ' Total portfolio value is $110,000 (Equities: 41%, Fixed Income: 27%, Cash: 23%, Crypto: 9%).';
      }
    } else if (lower.includes('loan') || lower.includes('mortgage') || lower.includes('borrow')) {
      intentTracked = 'loan_simulator_viewed';
      textResponse = 'I can help you calculate estimated monthly repayments for our Premier Personal Loan:';
      if (geminiUiEnabled) {
        generativeUi = {
          type: 'loan_calculator',
          title: 'Instant Loan Simulator',
          data: {
            principal: 50000,
            ratePercent: 3.88,
            tenureMonths: 36,
            monthlyPayment: 1473.45,
            currency: evalContext.country === 'SG' ? 'SGD' : 'USD'
          }
        };
      } else {
        textResponse += ' For a $50,000 loan over 36 months at 3.88% p.a., your estimated monthly repayment is $1,473.45.';
      }
    } else if (lower.includes('wealth') || lower.includes('insight') || lower.includes('projection') || lower.includes('forecast')) {
      intentTracked = 'wealth_projection_viewed';
      if (advancedInsightsEnabled) {
        textResponse = '✨ Advanced AI Wealth Projection unlocked for your tier:';
        if (geminiUiEnabled) {
          generativeUi = {
            type: 'wealth_insights_model',
            title: '5-Year Wealth Trajectory Forecast',
            data: {
              currentNetWorth: 110000,
              projected5Yr: 218500,
              compoundAnnualGrowthRate: '14.7%',
              riskScore: 'Balanced Growth (Tier 3)',
              recommendations: [
                'Increase monthly dollar-cost averaging by $500 into Global Equity Index',
                'Rebalance fixed income allocation to capture current 3.8% yields',
                'Tax-loss harvest eligible digital asset positions before quarter end'
              ]
            }
          };
        } else {
          textResponse += ' Your projected 5-year net worth is $218,500 with a 14.7% CAGR under balanced growth parameters.';
        }
      } else {
        textResponse = 'Advanced wealth forecasting is available to Singapore Premier clients and beta participants. Would you like to check your upgrade eligibility?';
      }
    } else if (lower.includes('fx') || lower.includes('rate') || lower.includes('exchange')) {
      intentTracked = 'fx_rates_viewed';
      textResponse = 'Here are the latest interbank FX exchange rates:';
      if (geminiUiEnabled) {
        generativeUi = {
          type: 'fx_rates_card',
          title: 'Live Interbank Rates',
          data: [
            { pair: 'USD/SGD', rate: 1.3425, change: '+0.12%' },
            { pair: 'EUR/USD', rate: 1.0870, change: '-0.05%' },
            { pair: 'USD/JPY', rate: 151.20, change: '+0.34%' },
            { pair: 'GBP/USD', rate: 1.2780, change: '+0.08%' }
          ]
        };
      }
    } else {
      textResponse = `Hello! I am your AI Financial Assistant. You can ask me to "view portfolio breakdown", "simulate a loan quote", or "show wealth forecast". (Session limits: max ${limitsConfig.maxTokens} tokens, temp: ${limitsConfig.temperature})`;
    }

    // OpenFeature Tracking API: track user conversion event
    trackEvent(intentTracked, evalContext, {
      messageLength: message.length,
      geminiUiEnabled,
      advancedInsightsEnabled
    });

    return res.json({
      reply: textResponse,
      generativeUi,
      limitsApplied: limitsConfig,
      flagsEvaluated: {
        geminiUiEnabled,
        advancedInsightsEnabled,
        limitsVariant: limitsConfig
      },
      evaluationContext: evalContext
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
