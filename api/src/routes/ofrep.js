const express = require('express');
const router = express.Router();
const flagService = require('../services/flagService');
const { evaluateFlag } = require('../engine/evaluator');

/**
 * POST /ofrep/v1/evaluate/flags/:key
 * Single flag evaluation conforming to OFREP specification.
 */
router.post('/evaluate/flags/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const context = req.body.context || {};

    const flag = await flagService.getFlagByKey(key);

    if (!flag) {
      return res.status(404).json({
        key,
        errorCode: 'FLAG_NOT_FOUND',
        errorDetails: `Flag with key "${key}" does not exist`
      });
    }

    const evaluation = evaluateFlag(flag, context);
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
 * Bulk flag evaluation conforming to OFREP specification.
 */
router.post('/evaluate/flags', async (req, res) => {
  try {
    const context = req.body.context || {};
    const appTag = req.query.appTag || req.body.appTag || context.appId;

    const filters = {};
    if (appTag) {
      filters.appTag = appTag;
    }

    const flags = await flagService.getAllFlags(filters);

    const evaluatedFlags = flags.map(flag => evaluateFlag(flag, context));

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
