const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

/**
 * POST /api/v1/analytics/track
 * Receives tracking events from OpenFeature client.track() calls.
 */
router.post('/track', async (req, res) => {
  try {
    const { eventName, targetingKey, context, details } = req.body;
    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    await analyticsService.recordTrackEvent(eventName, targetingKey, context, details);
    return res.status(202).json({ recorded: true, eventName, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Analytics tracking endpoint error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
