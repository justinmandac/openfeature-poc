const request = require('supertest');
const app = require('../src/app');
const { provider } = require('../src/openfeature/client');
const { start } = require('../../api/src/server');

let apiServer;

describe('WebApp BFF - Chat & OpenFeature Integration', () => {
  beforeAll(async () => {
    apiServer = await start();
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

  test('POST /api/chat - US Standard user has Gemini UI disabled and standard limits', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Show portfolio breakdown',
        context: { country: 'US', userTier: 'STANDARD', targetingKey: 'user-us-reg' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flagsEvaluated.geminiUiEnabled).toBe(false);
    expect(res.body.generativeUi).toBeNull(); // No Generative UI card rendered when flag is off
    expect(res.body.reply).toContain('Total portfolio value');
    expect(res.body.limitsApplied.maxTokens).toBe(500);
  });
});
