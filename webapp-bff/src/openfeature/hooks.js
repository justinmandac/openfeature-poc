/**
 * OpenFeature Evaluation Lifecycle Hooks
 */

class EvaluationLoggerHook {
  after(hookContext, evaluationDetails) {
    console.log(JSON.stringify({
      level: 'INFO',
      type: 'OPENFEATURE_EVALUATION',
      flagKey: hookContext.flagKey,
      variant: evaluationDetails.variant,
      reason: evaluationDetails.reason,
      targetingKey: hookContext.context?.targetingKey,
      timestamp: new Date().toISOString()
    }));
  }

  error(hookContext, err) {
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'OPENFEATURE_EVALUATION_ERROR',
      flagKey: hookContext.flagKey,
      error: err.message,
      targetingKey: hookContext.context?.targetingKey,
      timestamp: new Date().toISOString()
    }));
  }
}

class MetricsHook {
  before(hookContext) {
    return { startTime: Date.now() };
  }

  finally(hookContext, evaluationDetails, hints) {
    const startTime = hints?.startTime || Date.now();
    const latencyMs = Date.now() - startTime;

    // Track latency metric
    if (global.evaluationMetrics) {
      global.evaluationMetrics.push({
        flagKey: hookContext.flagKey,
        latencyMs,
        variant: evaluationDetails?.variant,
        timestamp: Date.now()
      });
    }
  }
}

class ContextEnrichmentHook {
  before(hookContext) {
    return {
      ...hookContext.context,
      appId: hookContext.context?.appId || 'webapp-bff',
      appGroup: 'financial-portal',
      serverHost: process.env.HOSTNAME || 'bff-node-01',
      evaluationTimestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  EvaluationLoggerHook,
  MetricsHook,
  ContextEnrichmentHook
};
