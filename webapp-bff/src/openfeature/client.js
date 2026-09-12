const { OpenFeature } = require('@openfeature/server-sdk');
const OfrepServerProvider = require('./OfrepServerProvider');
const { EvaluationLoggerHook, MetricsHook, ContextEnrichmentHook } = require('./hooks');
const { AsyncLocalStorageTransactionContextPropagator } = require('./transactionContext');
const axios = require('axios');

const apiUrl = process.env.API_URL || 'http://localhost:4000';
const provider = new OfrepServerProvider({ baseUrl: apiUrl });

// 1. Set Transaction Context Propagator (AsyncLocalStorage)
OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator());

// 2. Register OpenFeature Lifecycle Hooks
OpenFeature.addHooks(
  new EvaluationLoggerHook(),
  new MetricsHook(),
  new ContextEnrichmentHook()
);

OpenFeature.setProvider(provider);
const client = OpenFeature.getClient('webapp-bff');

// OpenFeature Tracking helper forwarding to Core API Analytics
async function trackEvent(eventName, context = {}, details = {}) {
  try {
    await axios.post(`${apiUrl}/api/v1/analytics/track`, {
      eventName,
      targetingKey: context.targetingKey,
      context,
      details
    }, { timeout: 2000 });
  } catch (err) {
    console.warn('Tracking dispatch error:', err.message);
  }
}

module.exports = {
  OpenFeature,
  client,
  provider,
  trackEvent
};
