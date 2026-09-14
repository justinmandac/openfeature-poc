const express = require('express');
const cors = require('cors');
const axios = require('axios');
const EventSource = require('eventsource');

const apiUrl = process.env.API_URL || 'http://localhost:4000';

const app = express();

app.use(cors());
app.use(express.json());

// In-memory connected SSE clients set
const sseClients = new Set();
let upstreamEventSource = null;
let upstreamConnected = false;

/**
 * Initializes single upstream SSE connection to internal Core API.
 * Broadcasts events to all connected channel clients (SSE Fanout).
 */
function initUpstreamSSE() {
  if (upstreamEventSource) {
    upstreamEventSource.close();
  }

  try {
    upstreamEventSource = new EventSource(`${apiUrl}/api/v1/events/flags`);

    upstreamEventSource.onopen = () => {
      upstreamConnected = true;
      console.log(`[Feature Gateway] Connected to internal Core API SSE stream at ${apiUrl}`);
    };

    upstreamEventSource.addEventListener('PROVIDER_CONFIGURATION_CHANGED', (event) => {
      // Fanout event to all connected public clients
      for (const clientRes of sseClients) {
        try {
          clientRes.write(`event: PROVIDER_CONFIGURATION_CHANGED\ndata: ${event.data}\n\n`);
        } catch (e) {
          // Handled on close
        }
      }
    });

    upstreamEventSource.onerror = () => {
      upstreamConnected = false;
    };
  } catch (err) {
    console.warn('[Feature Gateway] Upstream SSE connection setup warning:', err.message);
  }
}

function closeUpstreamSSE() {
  if (upstreamEventSource) {
    upstreamEventSource.close();
    upstreamEventSource = null;
    upstreamConnected = false;
  }
}

app.closeUpstreamSSE = closeUpstreamSSE;

// Start upstream connection
initUpstreamSSE();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'feature-gateway',
    role: 'Central Multi-Channel Feature Flag Gateway & Edge OFREP Proxy',
    upstreamApi: apiUrl,
    upstreamConnected,
    activeClientConnections: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * Gateway Information & Metrics
 */
app.get('/api/v1/gateway/info', (req, res) => {
  res.json({
    service: 'feature-gateway',
    version: '1.0.0',
    specification: 'OFREP v1 (OpenFeature Remote Evaluation Protocol)',
    supportedChannels: ['web', 'mobile-ios', 'mobile-android', 'partner-api', 'branch-teller'],
    tenancy: {
      mode: 'Multi-Tenant Omni-Channel Edge Proxy',
      activeBusinessUnits: ['retail', 'wealth', 'cards', 'platform'],
      channelPartitionedCaching: true
    },
    activeClientConnections: sseClients.size,
    upstreamConnected
  });
});

/**
 * POST /ofrep/v1/evaluate/flags
 * Central proxy for bulk OFREP evaluation with channel-aggregated routing, ETag 304 caching and context sanitization.
 */
app.post('/ofrep/v1/evaluate/flags', async (req, res) => {
  try {
    const incomingContext = req.body.context || {};
    const appTag = req.query.appTag || req.body.appTag || incomingContext.appTag || (incomingContext.appId === 'webapp' ? 'webapp' : undefined);
    const channel = req.query.channel || req.body.channel || incomingContext.channelId || incomingContext.channel || 'web';
    const bu = req.query.bu || req.body.bu || req.query.businessUnitId || incomingContext.businessUnit;
    const appId = req.query.appId || req.body.appId || incomingContext.applicationId || (incomingContext.appId && incomingContext.appId !== 'webapp' ? incomingContext.appId : undefined);

    // Context Sanitization: Ensure public clients cannot inject internal system overrides
    const sanitizedContext = { ...incomingContext };
    delete sanitizedContext.__internal_override;
    delete sanitizedContext.__bypass_auth;

    // Forward caching and attribution telemetry headers
    const forwardHeaders = {};
    if (req.headers['if-none-match']) {
      forwardHeaders['if-none-match'] = req.headers['if-none-match'];
    }

    const resolvedClientApp = req.headers['x-client-app'] || req.headers['x-caller-app'] || incomingContext.appId || incomingContext.callerApp || appId || appTag || (channel === 'mobile' ? 'android-app' : undefined);
    if (resolvedClientApp) {
      forwardHeaders['x-client-app'] = resolvedClientApp;
    }
    if (req.headers['x-channel'] || channel) {
      forwardHeaders['x-channel'] = req.headers['x-channel'] || channel;
    }
    if (req.headers['x-actor'] || incomingContext.targetingKey) {
      forwardHeaders['x-actor'] = req.headers['x-actor'] || incomingContext.targetingKey;
    }
    if (req.headers['x-business-unit'] || bu) {
      forwardHeaders['x-business-unit'] = req.headers['x-business-unit'] || bu;
    }

    const queryParams = new URLSearchParams();
    if (appTag) queryParams.set('appTag', appTag);
    if (channel) queryParams.set('channel', channel);
    if (bu) queryParams.set('bu', bu);
    if (appId || resolvedClientApp) queryParams.set('appId', appId || resolvedClientApp);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const upstreamRes = await axios.post(
      `${apiUrl}/ofrep/v1/evaluate/flags${queryString}`,
      { context: sanitizedContext, appTag, channel, bu, appId },
      {
        headers: forwardHeaders,
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 304 || status === 404
      }
    );

    // If Core API reports 304 Not Modified, pass it directly back to client
    if (upstreamRes.status === 304) {
      if (upstreamRes.headers.etag) {
        res.setHeader('ETag', upstreamRes.headers.etag);
      }
      return res.status(304).end();
    }

    if (upstreamRes.headers.etag) {
      res.setHeader('ETag', upstreamRes.headers.etag);
    }

    return res.status(upstreamRes.status).json(upstreamRes.data);
  } catch (error) {
    console.error('[Feature Gateway] Bulk OFREP proxy error:', error.message);
    return res.status(502).json({
      errorCode: 'GATEWAY_ERROR',
      errorDetails: `Upstream internal Core API error: ${error.response?.data?.errorDetails || error.message}`
    });
  }
});

/**
 * POST /ofrep/v1/evaluate/flags/:key
 * Central proxy for single flag evaluation.
 */
app.post('/ofrep/v1/evaluate/flags/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const context = req.body.context || {};

    const forwardHeaders = {};
    const resolvedClientApp = req.headers['x-client-app'] || req.headers['x-caller-app'] || context.appId || context.callerApp || req.query.appId || req.query.appTag || (req.headers['x-channel'] === 'mobile' ? 'android-app' : undefined);
    if (resolvedClientApp) {
      forwardHeaders['x-client-app'] = resolvedClientApp;
    }
    if (req.headers['x-channel'] || context.channel) {
      forwardHeaders['x-channel'] = req.headers['x-channel'] || context.channel;
    }
    if (req.headers['x-actor'] || context.targetingKey) {
      forwardHeaders['x-actor'] = req.headers['x-actor'] || context.targetingKey;
    }
    if (req.headers['x-business-unit'] || context.businessUnit) {
      forwardHeaders['x-business-unit'] = req.headers['x-business-unit'] || context.businessUnit;
    }

    const queryParams = new URLSearchParams();
    if (resolvedClientApp) queryParams.set('appId', resolvedClientApp);
    if (req.query.appTag) queryParams.set('appTag', req.query.appTag);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const upstreamRes = await axios.post(
      `${apiUrl}/ofrep/v1/evaluate/flags/${encodeURIComponent(key)}${queryString}`,
      { context },
      {
        headers: forwardHeaders,
        timeout: 5000,
        validateStatus: () => true
      }
    );

    return res.status(upstreamRes.status).json(upstreamRes.data);
  } catch (error) {
    console.error('[Feature Gateway] Single OFREP proxy error:', error.message);
    return res.status(502).json({
      errorCode: 'GATEWAY_ERROR',
      errorDetails: `Upstream internal Core API error: ${error.message}`
    });
  }
});

/**
 * GET /api/v1/events/flags
 * Server-Sent Events stream relaying configuration changes to web, mobile, and external clients.
 */
app.get('/api/v1/events/flags', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send immediate connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', service: 'feature-gateway' })}\n\n`);

  sseClients.add(res);

  // Auto-reconnect upstream if not connected
  if (!upstreamConnected) {
    initUpstreamSSE();
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

/**
 * POST /api/v1/analytics/track
 * Non-blocking event tracking relay.
 */
app.post('/api/v1/analytics/track', async (req, res) => {
  try {
    await axios
      .post(`${apiUrl}/api/v1/analytics/track`, req.body, { timeout: 3000 })
      .catch((err) => console.warn('[Feature Gateway] Analytics relay warning:', err.message));

    return res.json({ success: true, queued: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = app;
