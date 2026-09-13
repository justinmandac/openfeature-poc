const request = require('supertest');
const app = require('../src/app');
const { provider } = require('../src/openfeature/client');
const { start } = require('../../api/src/server');

let apiServer;

describe('WebApp BFF - Chat & OpenFeature Integration', () => {
  beforeAll(async () => {
    try {
      apiServer = await start();
    } catch (err) {
      if (err.code !== 'EADDRINUSE') throw err;
    }
  });

  afterAll(async () => {
    await provider.onClose();
    if (apiServer) {
      await new Promise(resolve => apiServer.close(resolve));
    }
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('POST /api/chat - Singapore Premium user gets Generative UI and Advanced Insights', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Show my wealth projection model',
        context: { country: 'SG', userTier: 'PREMIUM', targetingKey: 'user-sg-vip' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flagsEvaluated.geminiUiEnabled).toBe(true);
    expect(res.body.flagsEvaluated.advancedInsightsEnabled).toBe(true);
    expect(res.body.generativeUi).not.toBeNull();
    expect(res.body.generativeUi.type).toBe('wealth_insights_model');
    expect(res.body.limitsApplied.maxTokens).toBe(2000);
  });

  test('POST /api/chat - India Standard user has Gemini UI disabled and standard limits', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Show portfolio breakdown',
        context: { country: 'IN', userTier: 'STANDARD', targetingKey: 'user-in-standard' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flagsEvaluated.geminiUiEnabled).toBe(false);
    expect(res.body.generativeUi).toBeNull(); // No Generative UI card rendered when flag is off
    expect(res.body.reply).toContain('Total portfolio value');
    expect(res.body.limitsApplied.maxTokens).toBe(500);
  });

  test('GET /api/chat/history and session isolation across distinct personas', async () => {
    // 1. Check Sophia Chen history (user-sg-vip) has 2 messages from earlier test
    const sgRes = await request(app)
      .get('/api/chat/history?targetingKey=user-sg-vip');

    expect(sgRes.statusCode).toBe(200);
    expect(sgRes.body.targetingKey).toBe('user-sg-vip');
    expect(sgRes.body.messages.length).toBeGreaterThanOrEqual(2);
    expect(sgRes.body.messages[0].text).toContain('wealth projection');

    // 2. Check Priya Sharma history (user-in-standard) has its own messages
    const inRes = await request(app)
      .get('/api/chat/history?targetingKey=user-in-standard');

    expect(inRes.statusCode).toBe(200);
    expect(inRes.body.targetingKey).toBe('user-in-standard');
    expect(inRes.body.messages.length).toBeGreaterThanOrEqual(2);
    expect(inRes.body.messages[0].text).toContain('portfolio breakdown');

    // 3. Check Marcus Leung (user-hk-vip) has no prior history
    const hkRes = await request(app)
      .get('/api/chat/history?targetingKey=user-hk-vip');

    expect(hkRes.statusCode).toBe(200);
    expect(hkRes.body.messages.length).toBe(0);

    // 4. Delete Priya Sharma's history
    const delRes = await request(app)
      .delete('/api/chat/history?targetingKey=user-in-standard');

    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.messages.length).toBe(0);

    // 5. Verify Sophia's history is still intact!
    const sgResAfter = await request(app)
      .get('/api/chat/history?targetingKey=user-sg-vip');
    expect(sgResAfter.body.messages.length).toBe(sgRes.body.messages.length);
  });
});
