const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const flagService = require('../services/flagService');
const { evaluateFlag } = require('../engine/evaluator');
const analyticsService = require('../services/analyticsService');

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

    // Non-blocking telemetry tracking
    analyticsService.recordEvaluation(key, evaluation.variant, evaluation.reason);

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
    const appId = req.query.appId || req.body.appId || context.applicationId || (context.appId && context.appId !== 'webapp' ? context.appId : undefined);

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

    // Check If-None-Match header for 304 Not Modified
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }

    res.setHeader('ETag', etag);

    const evaluatedFlags = flags.map(flag => {
      const evalResult = evaluateFlag(flag, context, { allFlagsMap, segmentsMap });
      analyticsService.recordEvaluation(flag.key, evalResult.variant, evalResult.reason);
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
