const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const runMigrations = require('../src/db/runMigrations');
const runSeeds = require('../src/db/runSeeds');

beforeAll(async () => {
  await runMigrations();
  await runSeeds();
});

afterAll(async () => {
  await db.destroy();
});

describe('Core API - Health & Spec', () => {
  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /openapi.json returns OpenAPI summary', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.statusCode).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });
});

describe('OFREP Evaluation Endpoints', () => {
  test('Single evaluation - Default variant fallback', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui')
      .send({ context: { country: 'GB' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.key).toBe('feature.chatbot-gemini-ui');
    expect(res.body.value).toBe(true);
    expect(res.body.reason).toBe('DEFAULT');
    expect(res.body.variant).toBe('on');
  });

  test('Single evaluation - Targeting rule match (US regional disable rule)', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui')
      .send({ context: { country: 'US' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(false);
    expect(res.body.reason).toBe('TARGETING_MATCH');
    expect(res.body.variant).toBe('off');
    expect(res.body.metadata.ruleId).toBe('rule-gemini-us-disabled');
  });

  test('Single evaluation - Compound targeting rule match (SG + PREMIUM)', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.advanced-financial-insights')
      .send({ context: { country: 'SG', userTier: 'PREMIUM' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(true);
    expect(res.body.reason).toBe('TARGETING_MATCH');
    expect(res.body.variant).toBe('on');
  });

  test('Single evaluation - Non-matching compound rule falls back to default', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.advanced-financial-insights')
      .send({ context: { country: 'US', userTier: 'STANDARD' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(false);
    expect(res.body.reason).toBe('DEFAULT');
    expect(res.body.variant).toBe('off');
  });

  test('Single evaluation - Structured OBJECT configuration', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/config.chatbot-limits')
      .send({ context: { userTier: 'PREMIUM' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.reason).toBe('TARGETING_MATCH');
    expect(res.body.variant).toBe('premium');
    expect(res.body.value.maxTokens).toBe(2000);
    expect(res.body.value.allowedTools).toContain('instant_transfer');
  });

  test('Single evaluation - Flag not found returns OFREP 404 error response', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/non-existent-flag')
      .send({});

    expect(res.statusCode).toBe(404);
    expect(res.body.errorCode).toBe('FLAG_NOT_FOUND');
  });

  test('Bulk evaluation - Evaluates multiple flags for a given context', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .send({ context: { country: 'SG', userTier: 'PREMIUM', appId: 'webapp' } });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.flags)).toBe(true);
    expect(res.body.flags.length).toBeGreaterThanOrEqual(1);

    const bannerFlag = res.body.flags.find(f => f.key === 'config.banner-announcement');
    expect(bannerFlag).toBeDefined();
    expect(bannerFlag.variant).toBe('sg-exclusive');
  });
});

describe('Admin REST API & Schema Validation', () => {
  test('GET /api/v1/admin/flags lists inventory metadata', async () => {
    const res = await request(app).get('/api/v1/admin/flags');
    expect(res.statusCode).toBe(200);
    expect(res.body.flags.length).toBeGreaterThan(0);
    expect(res.body.flags[0]).toHaveProperty('age');
    expect(res.body.flags[0]).toHaveProperty('app_tags');
  });

  test('POST /api/v1/admin/flags enforces JSON Schema on OBJECT type flags', async () => {
    // Attempt creating with invalid variant payload according to schema
    const invalidFlag = {
      key: 'config.test-invalid',
      type: 'OBJECT',
      default_variant: 'v1',
      variants: {
        v1: { maxRate: 'not-a-number' } // Invalid: expects number
      },
      schema: {
        type: 'object',
        required: ['maxRate'],
        properties: {
          maxRate: { type: 'number' }
        }
      },
      description: 'Test flag with invalid schema'
    };

    const res = await request(app)
      .post('/api/v1/admin/flags')
      .send(invalidFlag);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/failed schema validation/);
  });

  test('POST /api/v1/admin/flags successfully creates a valid flag and records audit history', async () => {
    const validFlag = {
      key: 'feature.crypto-staking',
      type: 'BOOLEAN',
      state: 'ENABLED',
      default_variant: 'off',
      variants: { on: true, off: false },
      rules: [
        {
          id: 'rule-sg-staking',
          priority: 1,
          condition: { country: 'SG' },
          variant: 'on'
        }
      ],
      app_tags: ['webapp', 'bff'],
      description: 'Enables high yield staking pools'
    };

    const createRes = await request(app)
      .post('/api/v1/admin/flags')
      .set('x-author', 'lead-architect')
      .send(validFlag);

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.flag.key).toBe('feature.crypto-staking');
    expect(createRes.body.flag.version).toBe(1);

    // Verify history audit record
    const historyRes = await request(app).get('/api/v1/admin/flags/feature.crypto-staking/history');
    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.body.history.length).toBe(1);
    expect(historyRes.body.history[0].author).toBe('lead-architect');
  });

  test('PUT /api/v1/admin/flags updates flag and increments version in history', async () => {
    const updatePayload = {
      description: 'Updated crypto staking description',
      state: 'DISABLED'
    };

    const updateRes = await request(app)
      .put('/api/v1/admin/flags/feature.crypto-staking')
      .set('x-author', 'sec-auditor')
      .send(updatePayload);

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.flag.version).toBe(2);
    expect(updateRes.body.flag.state).toBe('DISABLED');

    // Verify history records 2 revisions
    const historyRes = await request(app).get('/api/v1/admin/flags/feature.crypto-staking/history');
    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.body.history.length).toBe(2);
    expect(historyRes.body.history[0].version).toBe(2);
    expect(historyRes.body.history[0].author).toBe('sec-auditor');
    expect(historyRes.body.history[0].diff.changes.state.to).toBe('DISABLED');
  });
});
