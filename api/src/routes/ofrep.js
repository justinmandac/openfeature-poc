const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const flagService = require('../services/flagService');
const { evaluateFlag } = require('../engine/evaluator');
const analyticsService = require('../services/analyticsService');

function resolveCallerApp(req, context) {
  const channel = req.headers['x-channel'] || req.query.channel || context.channel || context.channelId;
  return (
    req.headers['x-client-app'] ||
    req.headers['x-caller-app'] ||
    req.query.appId ||
    req.query.appTag ||
    req.body.appId ||
    req.body.appTag ||
    context.appId ||
    context.callerApp ||
    context.appName ||
    (context.platform === 'android' || channel === 'mobile' ? 'android-app' : null) ||
    (channel === 'backend' ? 'webapp-bff' : null) ||
    (req.headers['referer']?.includes(':3000') || req.headers['origin']?.includes(':3000') ? 'webapp' : null) ||
    (req.headers['referer']?.includes(':4001') || req.headers['origin']?.includes(':4001') ? 'admin-playground' : null) ||
    (req.headers['referer']?.includes(':4002') || req.headers['origin']?.includes(':4002') ? 'webapp-bff' : null) ||
    (channel === 'web' ? 'webapp' : null) ||
    'unknown'
  );
}

/**
 * POST /ofrep/v1/evaluate/flags/:key
 * Single flag evaluation conforming to OFREP specification with telemetry recording.
 */
router.post('/evaluate/flags/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const context = req.body.context || {};

    const [flag, { allFlagsMap, segmentsMap }] = await Promise.all([
      flagService.getFlagByKey(key),
      flagService.getEvaluationContextMaps()
    ]);

    if (!flag) {
      return res.status(404).json({
        key,
        errorCode: 'FLAG_NOT_FOUND',
        errorDetails: `Flag with key "${key}" does not exist`
      });
    }

    const evaluation = evaluateFlag(flag, context, { allFlagsMap, segmentsMap });

    // Non-blocking telemetry tracking with caller attribution ("who evaluated what")
    const callerApp = resolveCallerApp(req, context);
    const targetingKey = context.targetingKey || context.userId || context.user_id || 'anonymous';
    const channelName = req.headers['x-channel'] || req.query.channel || context.channel || context.channelId || (callerApp === 'android-app' ? 'mobile' : 'web');
    const buName = req.query.bu || context.businessUnit || flag.business_unit_id;

    analyticsService.recordEvaluation({
      flagKey: flag.key,
      variant: evaluation.variant,
      reason: evaluation.reason,
      targetingKey,
      callerApp,
      channel: channelName,
      businessUnit: buName,
      context
    });

    return res.status(200).json(evaluation);
  } catch (error) {
    console.error('OFREP evaluation error:', error);
    return res.status(500).json({
      errorCode: 'GENERAL',
      errorDetails: error.message
    });
  }
});

/**
 * POST /ofrep/v1/evaluate/flags
 * Bulk flag evaluation conforming to OFREP specification with ETag 304 HTTP caching.
 */
router.post('/evaluate/flags', async (req, res) => {
  try {
    const context = req.body.context || {};
    const appTag = req.query.appTag || req.body.appTag || context.appTag || (context.appId === 'webapp' ? 'webapp' : undefined);
    const channel = req.query.channel || req.body.channel || context.channelId || context.channel;
    const bu = req.query.bu || req.body.bu || req.query.businessUnitId || context.businessUnit;
    const appId = (req.query.appId && req.query.appId !== 'webapp' ? req.query.appId : undefined) ||
                  (req.body.appId && req.body.appId !== 'webapp' ? req.body.appId : undefined) ||
                  context.applicationId ||
                  (context.appId && context.appId !== 'webapp' ? context.appId : undefined);

    const filters = {};
    if (appTag) filters.appTag = appTag;
    if (channel) filters.channel = channel;
    if (bu) filters.bu = bu;
    if (appId) filters.appId = appId;

    const [flags, { allFlagsMap, segmentsMap }] = await Promise.all([
      flagService.getAllFlags(filters),
      flagService.getEvaluationContextMaps()
    ]);

    // Compute partitioned ETag from channel, BU, flag keys, versions, and context
    const partitionKey = `${channel || 'all'}:${bu || 'all'}:${appId || 'all'}`;
    const versionString = flags.map(f => `${f.key}:${f.version}:${f.updated_at}`).join('|');
    const etag = `"${crypto.createHash('md5').update(partitionKey + versionString + JSON.stringify(context)).digest('hex')}"`;

    res.setHeader('ETag', etag);

    // Check If-None-Match header for 304 Not Modified
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }

    const callerApp = resolveCallerApp(req, context);
    const targetingKey = context.targetingKey || context.userId || context.user_id || 'anonymous';
    const channelName = req.headers['x-channel'] || channel || (callerApp === 'android-app' ? 'mobile' : 'web');

    const evaluatedFlags = flags.map(flag => {
      const evalResult = evaluateFlag(flag, context, { allFlagsMap, segmentsMap });
      analyticsService.recordEvaluation({
        flagKey: flag.key,
        variant: evalResult.variant,
        reason: evalResult.reason,
        targetingKey,
        callerApp,
        channel: channelName,
        businessUnit: bu || flag.business_unit_id,
        context
      });
      return evalResult;
    });

    return res.status(200).json({
      flags: evaluatedFlags
    });
  } catch (error) {
    console.error('OFREP bulk evaluation error:', error);
    return res.status(500).json({
      errorCode: 'GENERAL',
      errorDetails: error.message
    });
  }
});

module.exports = router;
