const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const runMigrations = require('../src/db/runMigrations');
const runSeeds = require('../src/db/runSeeds');
const schedulerService = require('../src/services/schedulerService');
const analyticsService = require('../src/services/analyticsService');

beforeAll(async () => {
  await runMigrations();
  await runSeeds();
});

afterAll(async () => {
  schedulerService.stop();
  await db.destroy();
});

// Helper to wait for setImmediate background telemetry ingestion to complete
const flushTelemetry = () => new Promise((resolve) => setTimeout(resolve, 150));

describe('Evaluation Tracking, Caller Attribution & Flag Hygiene', () => {
  const TEST_FLAG_KEY = 'retail.copilot.gemini-ui';

  test('Single flag evaluation records caller app, channel, and actor attribution', async () => {
    const res = await request(app)
      .post(`/ofrep/v1/evaluate/flags/${TEST_FLAG_KEY}`)
      .set('X-Client-App', 'webapp')
      .set('X-Channel', 'web')
      .send({
        context: {
          targetingKey: 'tester-sg-001',
          country: 'SG',
          userTier: 'PREMIUM'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.key).toBe(TEST_FLAG_KEY);

    await flushTelemetry();

    // Verify analytics details endpoint
    const detailsRes = await request(app).get(`/api/v1/admin/flags/${TEST_FLAG_KEY}/evaluations`);
    expect(detailsRes.statusCode).toBe(200);
    expect(detailsRes.body.flagKey).toBe(TEST_FLAG_KEY);
    expect(detailsRes.body.totalEvaluations).toBeGreaterThanOrEqual(1);

    // Verify callerApps contains 'webapp'
    const webappCaller = detailsRes.body.callerApps.find((c) => c.app === 'webapp');
    expect(webappCaller).toBeDefined();
    expect(webappCaller.count).toBeGreaterThanOrEqual(1);

    // Verify channels contains 'web'
    const webChannel = detailsRes.body.channels.find((c) => c.channel === 'web');
    expect(webChannel).toBeDefined();

    // Verify actors contains 'tester-sg-001'
    const actorRecord = detailsRes.body.actors.find((a) => a.targetingKey === 'tester-sg-001');
    expect(actorRecord).toBeDefined();

    // Verify recentLogs contains the event
    const recentLog = detailsRes.body.recentLogs.find((l) => l.targetingKey === 'tester-sg-001');
    expect(recentLog).toBeDefined();
    expect(recentLog.callerApp).toBe('webapp');
    expect(recentLog.channel).toBe('web');
  });

  test('Bulk flag evaluation records android-app caller and mobile channel', async () => {
    const res = await request(app)
      .post('/ofrep/v1/evaluate/flags?channel=mobile')
      .set('X-Client-App', 'android-app')
      .set('X-Channel', 'mobile')
      .send({
        context: {
          targetingKey: 'android-user-888',
          country: 'SG',
          channel: 'mobile'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
    expect(Array.isArray(res.body.flags)).toBe(true);

    await flushTelemetry();

    // Verify system-wide analytics
    const analyticsRes = await request(app).get('/api/v1/admin/analytics');
    expect(analyticsRes.statusCode).toBe(200);
    expect(analyticsRes.body.totalEvaluations).toBeGreaterThanOrEqual(1);
    expect(analyticsRes.body.uniqueActorsCount).toBeGreaterThanOrEqual(1);

    // Check appBreakdown includes android-app
    const androidAppStat = analyticsRes.body.appBreakdown.find((a) => a.app === 'android-app');
    expect(androidAppStat).toBeDefined();

    // Check channelBreakdown includes mobile
    const mobileChannelStat = analyticsRes.body.channelBreakdown.find((c) => c.channel === 'mobile');
    expect(mobileChannelStat).toBeDefined();
  });

  test('WebApp BFF and Admin Simulator caller attribution is captured accurately', async () => {
    // 1. WebApp BFF evaluation
    const bffRes = await request(app)
      .post(`/ofrep/v1/evaluate/flags/${TEST_FLAG_KEY}?appTag=bff&appId=webapp-bff`)
      .set('X-Client-App', 'webapp-bff')
      .set('X-Channel', 'backend')
      .send({
        context: {
          targetingKey: 'bff-user-500',
          appId: 'webapp-bff',
          callerApp: 'webapp-bff'
        }
      });
    expect(bffRes.statusCode).toBe(200);

    // 2. Admin Playground evaluation
    const adminRes = await request(app)
      .post(`/ofrep/v1/evaluate/flags/${TEST_FLAG_KEY}?appTag=admin&appId=admin-playground`)
      .set('X-Client-App', 'admin-playground')
      .set('X-Channel', 'web')
      .send({
        context: {
          targetingKey: 'admin-sim-user',
          appId: 'admin-playground',
          callerApp: 'admin-playground'
        }
      });
    expect(adminRes.statusCode).toBe(200);

    // 3. Fallback inference when headers are missing (e.g. platform=android or channel=mobile)
    const fallbackRes = await request(app)
      .post(`/ofrep/v1/evaluate/flags/${TEST_FLAG_KEY}`)
      .send({
        context: {
          targetingKey: 'mobile-no-header-user',
          platform: 'android',
          channel: 'mobile'
        }
      });
    expect(fallbackRes.statusCode).toBe(200);

    await flushTelemetry();

    const detailsRes = await request(app).get(`/api/v1/admin/flags/${TEST_FLAG_KEY}/evaluations`);
    expect(detailsRes.statusCode).toBe(200);

    const bffCaller = detailsRes.body.callerApps.find((c) => c.app === 'webapp-bff');
    expect(bffCaller).toBeDefined();

    const adminCaller = detailsRes.body.callerApps.find((c) => c.app === 'admin-playground');
    expect(adminCaller).toBeDefined();

    const fallbackLog = detailsRes.body.recentLogs.find((l) => l.targetingKey === 'mobile-no-header-user');
    expect(fallbackLog).toBeDefined();
    expect(fallbackLog.callerApp).toBe('android-app');
  });

  test('Hygiene report identifies dead flags, 0 evaluations, and technical debt', async () => {
    // Create an unused flag with 0 evaluations
    const deadFlagKey = 'test.dead.unreferenced-flag';
    await request(app)
      .post('/api/v1/admin/flags')
      .send({
        key: deadFlagKey,
        business_unit_id: 'bu-retail',
        type: 'BOOLEAN',
        state: 'DISABLED',
        lifecycle_state: 'DISABLED',
        default_variant: 'off',
        variants: [{ key: 'on', value: true }, { key: 'off', value: false }],
        description: 'Unused dead flag created for hygiene verification'
      });

    const hygieneRes = await request(app).get('/api/v1/admin/hygiene');
    expect(hygieneRes.statusCode).toBe(200);
    expect(hygieneRes.body.hygieneIssues).toBeDefined();
    expect(Array.isArray(hygieneRes.body.hygieneIssues)).toBe(true);

    // Verify dead flag is captured
    const deadIssue = hygieneRes.body.hygieneIssues.find((i) => i.flagKey === deadFlagKey);
    expect(deadIssue).toBeDefined();
    expect(deadIssue.totalEvaluations).toBe(0);
    expect(deadIssue.recommendedAction).toBe('ARCHIVE');

    // Test 1-click Archive action
    const archiveRes = await request(app).post(`/api/v1/admin/flags/${deadFlagKey}/archive`);
    expect(archiveRes.statusCode).toBe(200);
    expect(archiveRes.body.flag.lifecycle_state).toBe('ARCHIVED');
    expect(archiveRes.body.flag.state).toBe('DISABLED');

    // Clean up test flag
    await request(app).delete(`/api/v1/admin/flags/${deadFlagKey}`);
  });

  test('1-click Flag Graduation freezes variant permanently', async () => {
    const gradFlagKey = 'test.graduation.candidate';
    await request(app)
      .post('/api/v1/admin/flags')
      .send({
        key: gradFlagKey,
        business_unit_id: 'bu-platform',
        type: 'BOOLEAN',
        state: 'ENABLED',
        lifecycle_state: 'ENABLED',
        default_variant: 'on',
        variants: [{ key: 'on', value: true }, { key: 'off', value: false }],
        description: 'Flag ready for graduation'
      });

    const gradRes = await request(app)
      .post(`/api/v1/admin/flags/${gradFlagKey}/graduate`)
      .send({ variant: 'on', reason: 'Feature fully baked in prod' });

    expect(gradRes.statusCode).toBe(200);
    expect(gradRes.body.flag.lifecycle_state).toBe('GRADUATED');
    expect(gradRes.body.flag.graduated_variant).toBe('on');

    // Clean up
    await request(app).delete(`/api/v1/admin/flags/${gradFlagKey}`);
  });

  test('Export Cleanup Sprint Ticket generates markdown document', async () => {
    const exportRes = await request(app).get('/api/v1/admin/hygiene/export');
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.headers['content-type']).toContain('text/markdown');
    expect(exportRes.text).toContain('Technical Debt & Flag Cleanup Sprint Ticket');
    expect(exportRes.text).toContain('Total Flags Audited');
    expect(exportRes.text).toContain('Permanent Features Ready for Graduation');
  });
});
