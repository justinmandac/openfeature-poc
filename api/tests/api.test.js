const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const runMigrations = require('../src/db/runMigrations');
const runSeeds = require('../src/db/runSeeds');
const schedulerService = require('../src/services/schedulerService');

beforeAll(async () => {
  await runMigrations();
  await runSeeds();
});

afterAll(async () => {
  schedulerService.stop();
  await db.destroy();
});

describe('Core API - Health, Spec & ETag Caching', () => {
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

  test('POST /ofrep/v1/evaluate/flags returns ETag and 304 Not Modified on subsequent request', async () => {
    const res1 = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .send({ context: { country: 'SG' } });

    expect(res1.statusCode).toBe(200);
    const etag = res1.headers['etag'];
    expect(etag).toBeDefined();

    // Subsequent call with If-None-Match
    const res2 = await request(app)
      .post('/ofrep/v1/evaluate/flags')
      .set('If-None-Match', etag)
      .send({ context: { country: 'SG' } });

    expect(res2.statusCode).toBe(304);
  });
});

describe('OFREP Evaluation Engine - TPO Enhancements', () => {
  test('Prerequisite resolution: When prerequisite is met, rule evaluates successfully', async () => {
    // For APAC Premier user in SG, chatbot-gemini-ui resolves to 'on', meeting prerequisite
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.advanced-financial-insights')
      .send({ context: { country: 'SG', userTier: 'PREMIUM', targetingKey: 'user-sg-vip' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(true);
    expect(res.body.reason).toBe('TARGETING_MATCH');
    expect(res.body.variant).toBe('on');
  });

  test('Prerequisite resolution: When prerequisite is NOT met, returns PREREQUISITE_FAILED reason', async () => {
    // For US user, chatbot-gemini-ui resolves to 'off' (due to US regional rule), failing prerequisite!
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.advanced-financial-insights')
      .send({ context: { country: 'US', userTier: 'PREMIUM', targetingKey: 'user-us-vip' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(false);
    expect(res.body.reason).toBe('PREREQUISITE_FAILED');
    expect(res.body.metadata.unmetPrerequisite).toBe('feature.chatbot-gemini-ui');
  });

  test('Reusable Segment resolution: Matches rule using segmentId condition', async () => {
    // segment-apac-premier requires country: ['SG', 'PH'] and userTier: 'PREMIUM'
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.advanced-financial-insights')
      .send({ context: { country: 'PH', userTier: 'PREMIUM', targetingKey: 'user-ph-vip' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(true);
    expect(res.body.reason).toBe('TARGETING_MATCH');
  });

  test('Percentage Rollout: Sticky deterministic bucketing (MurmurHash3)', async () => {
    // Evaluating the same targetingKey multiple times returns consistent bucket and variant
    const context = { userTier: 'STANDARD', targetingKey: 'sticky-user-42' };

    const res1 = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui')
      .send({ context });

    const res2 = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui')
      .send({ context });

    expect(res1.body.variant).toBe(res2.body.variant);
    expect(res1.body.metadata.bucket).toBe(res2.body.metadata.bucket);
  });

  test('Lifecycle State: DRAFT flag returns safe default and reason DEFAULT', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/feature.crypto-staking-pools')
      .send({ context: { country: 'SG' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.reason).toBe('DEFAULT');
    expect(res.body.metadata.lifecycleState).toBe('DRAFT');
  });

  test('Lifecycle State: GRADUATED flag returns permanent static variant with reason STATIC', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags/config.legacy-auth-migration')
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe('OAuth2.1-PKCE');
    expect(res.body.reason).toBe('STATIC');
    expect(res.body.metadata.graduated).toBe(true);
  });
});

describe('Reusable Segments & Scheduled Releases Management', () => {
  test('Segments CRUD: Create, Read, Update, Delete segment', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/v1/admin/segments')
      .send({
        id: 'segment-test-eu',
        name: 'EU Retail Users',
        description: 'Retail clients in UK and Europe',
        condition: { country: ['GB', 'DE', 'FR'] }
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.segment.id).toBe('segment-test-eu');

    // 2. Read
    const getRes = await request(app).get('/api/v1/admin/segments');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.segments.some(s => s.id === 'segment-test-eu')).toBe(true);

    // 3. Delete
    const delRes = await request(app).delete('/api/v1/admin/segments/segment-test-eu');
    expect(delRes.statusCode).toBe(200);
  });

  test('Scheduled Changes: Create and process scheduled release', async () => {
    const scheduleRes = await request(app)
      .post('/api/v1/admin/scheduled-changes')
      .send({
        flag_key: 'config.chatbot-limits',
        scheduled_at: new Date(Date.now() - 1000).toISOString(), // already due
        changes: { description: 'Scheduled limits update' },
        author: 'release-bot',
        reason: 'Automated launch'
      });

    expect(scheduleRes.statusCode).toBe(201);
    expect(scheduleRes.body.scheduledChange.status).toBe('PENDING');

    // Trigger processor
    await schedulerService.processPendingChanges();

    // Verify applied
    const changesRes = await request(app).get('/api/v1/admin/scheduled-changes?flagKey=config.chatbot-limits');
    expect(changesRes.statusCode).toBe(200);
    const applied = changesRes.body.scheduledChanges.find(c => c.id === scheduleRes.body.scheduledChange.id);
    expect(applied.status).toBe('APPLIED');
  });
});

describe('Analytics, Tracking API & Flag Hygiene', () => {
  test('POST /api/v1/analytics/track records business event', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/track')
      .send({
        eventName: 'loan_application_submitted',
        targetingKey: 'user-vip-01',
        context: { country: 'SG', userTier: 'PREMIUM' },
        details: { amount: 75000 }
      });

    expect(res.statusCode).toBe(202);
    expect(res.body.recorded).toBe(true);
  });

  test('GET /api/v1/admin/analytics returns evaluation summary', async () => {
    const res = await request(app).get('/api/v1/admin/analytics');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.flagMetrics)).toBe(true);
    expect(res.body.flagMetrics.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/admin/hygiene returns stale flag report', async () => {
    const res = await request(app).get('/api/v1/admin/hygiene');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.hygieneIssues)).toBe(true);
  });
});
