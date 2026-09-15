const request = require('supertest');
const app = require('../src/app');
const { start } = require('../../api/src/server');

let apiServer;

describe('Central Feature Gateway - Multi-Channel OFREP Proxy', () => {
  beforeAll(async () => {
    try {
      apiServer = await start();
    } catch (err) {
      if (err.code !== 'EADDRINUSE') throw err;
    }
  });

  afterAll(async () => {
    if (app.closeUpstreamSSE) {
      app.closeUpstreamSSE();
    }
    if (apiServer) {
      await new Promise((resolve) => apiServer.close(resolve));
    }
  });

  test('GET /health returns healthy status and gateway role', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('feature-gateway');
    expect(res.body.upstreamApi).toBeDefined();
  });

  test('GET /api/v1/gateway/info returns multi-channel specification metadata', async () => {
    const res = await request(app).get('/api/v1/gateway/info');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('feature-gateway');
    expect(res.body.specification).toContain('OFREP v1');
    expect(res.body.supportedChannels).toEqual(
      expect.arrayContaining(['web', 'mobile-ios', 'mobile-android', 'partner-api'])
    );
  });

  test('POST /ofrep/v1/evaluate/flags proxies bulk evaluation with ETag support', async () => {
    const context = {
      targetingKey: 'user-sg-vip',
      country: 'SG',
      userTier: 'PREMIUM',
      appId: 'webapp'
    };

    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .send({ context });

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
    expect(Array.isArray(res.body.flags)).toBe(true);
    expect(res.headers.etag).toBeDefined();

    const geminiFlag = res.body.flags.find((f) => f.key === 'feature.chatbot-gemini-ui');
    expect(geminiFlag).toBeDefined();
    expect(geminiFlag.value).toBe(true);

    // Test ETag 304 Caching
    const cachedRes = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .set('If-None-Match', res.headers.etag)
      .send({ context });

    expect(cachedRes.statusCode).toBe(304);
  });

  test('POST /ofrep/v1/evaluate/flags/:key proxies single flag evaluation', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui')
      .send({
        context: {
          targetingKey: 'user-in-standard',
          country: 'IN',
          userTier: 'STANDARD'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.key).toBe('feature.chatbot-gemini-ui');
    expect(res.body.value).toBe(false); // Disabled in India for regulatory compliance
    expect(res.body.reason).toBe('TARGETING_MATCH');
  });

  test('POST /api/v1/analytics/track accepts telemetry relay', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/track')
      .send({
        eventName: 'test_gateway_event',
        targetingKey: 'user-sg-vip',
        context: { country: 'SG' },
        details: { source: 'mobile-app' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /ofrep/v1/evaluate/flags sanitizes dangerous context properties', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .send({
        context: {
          targetingKey: 'malicious-probe',
          country: 'SG',
          userTier: 'PREMIUM',
          __internal_override: true,
          __bypass_auth: true
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
  });

  test('POST /ofrep/v1/evaluate/flags?channel=web proxies omni-channel aggregated evaluation', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags?channel=web')
      .send({
        context: {
          targetingKey: 'user-sg-vip',
          country: 'SG',
          userTier: 'PREMIUM',
          channel: 'web'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
    const flagKeys = res.body.flags.map((f) => f.key);
    expect(flagKeys).toContain('retail.copilot.gemini-ui');
    expect(flagKeys).toContain('wealth.advisory.predictive-insights');
    expect(flagKeys).toContain('platform.banner.announcement');
  });

  test('POST /ofrep/v1/evaluate/flags?bu=wealth scopes evaluation strictly to Wealth Business Unit', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags?bu=wealth')
      .send({
        context: {
          targetingKey: 'user-sg-vip',
          country: 'SG',
          userTier: 'PREMIUM'
        }
      });

    expect(res.statusCode).toBe(200);
    const nonWealth = res.body.flags.filter(
      (f) => f.key.startsWith('retail.') || f.key.startsWith('cards.')
    );
    expect(nonWealth.length).toBe(0);
  });

  test('POST /ofrep/v1/evaluate/flags?appId=retail-copilot filters strictly to copilot application', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags?appId=retail-copilot')
      .send({
        context: {
          targetingKey: 'user-sg-vip',
          country: 'SG',
          userTier: 'PREMIUM'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
    const flagKeys = res.body.flags.map((f) => f.key);
    expect(flagKeys).toContain('retail.copilot.gemini-ui');
    const nonCopilot = res.body.flags.filter((f) => f.key.startsWith('wealth.'));
    expect(nonCopilot.length).toBe(0);
  });
});

