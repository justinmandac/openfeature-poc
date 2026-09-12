const express = require('express');
const router = express.Router();
const flagEvents = require('../services/eventEmitter');

/**
 * GET /api/v1/events/flags
 * Server-Sent Events stream for OpenFeature configuration change events.
 */
router.get('/flags', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/proxies
  res.flushHeaders();

  flagEvents.addClient(res);
});

module.exports = router;
