const request = require('supertest');
const { app } = require('../src/server');
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

describe('Enterprise Multi-Tenancy Platform Test Suite', () => {
  test('GET /api/v1/admin/business-units returns all BUs with applications and metrics', async () => {
    const res = await request(app).get('/api/v1/admin/business-units');

    expect(res.statusCode).toBe(200);
    expect(res.body.businessUnits).toBeDefined();
    expect(res.body.businessUnits.length).toBeGreaterThanOrEqual(4);

    const wealthBu = res.body.businessUnits.find((b) => b.code === 'wealth');
    expect(wealthBu).toBeDefined();
    expect(wealthBu.name).toBe('Wealth & Asset Management');
    expect(wealthBu.applications.length).toBeGreaterThanOrEqual(2);
    expect(wealthBu.flagCount).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/v1/admin/applications filters applications by business unit', async () => {
    const res = await request(app).get('/api/v1/admin/applications?bu=cards');

    expect(res.statusCode).toBe(200);
    expect(res.body.applications).toBeDefined();
    expect(res.body.applications.length).toBeGreaterThanOrEqual(1);

    for (const app of res.body.applications) {
      expect(app.business_unit_id).toBe('bu-cards');
      expect(Array.isArray(app.allowed_channels)).toBe(true);
    }
  });

  test('GET /api/v1/admin/flags?bu=wealth filters flags strictly to Wealth BU', async () => {
    const res = await request(app).get('/api/v1/admin/flags?bu=wealth');

    expect(res.statusCode).toBe(200);
    expect(res.body.flags).toBeDefined();
    expect(res.body.flags.length).toBeGreaterThanOrEqual(2);

    for (const flag of res.body.flags) {
      expect(flag.business_unit_id).toBe('bu-wealth');
    }
  });

  test('POST /ofrep/v1/evaluate/flags?channel=web evaluates flags targeted to the Web channel', async () => {
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
    expect(Array.isArray(res.body.flags)).toBe(true);

    // Verify presence of flags across Retail, Wealth, Cards, and Platform on the shared Web channel
    const flagKeys = res.body.flags.map((f) => f.key);
    expect(flagKeys).toContain('retail.copilot.gemini-ui');
    expect(flagKeys).toContain('wealth.advisory.predictive-insights');
    expect(flagKeys).toContain('platform.banner.announcement');
    expect(flagKeys).toContain('cards.rewards.travel-multiplier');
  });

  test('Cross-tenant prerequisite validation rejects illegal inter-BU dependencies', async () => {
    // Attempt to create a flag in Cards BU that depends on a non-global Retail BU flag
    const res = await request(app)
      .post('/api/v1/admin/flags')
      .send({
        key: 'cards.illegal.cross-tenant-flag',
        business_unit_id: 'bu-cards',
        app_id: 'app-cards-rewards',
        type: 'BOOLEAN',
        default_variant: 'off',
        variants: { on: true, off: false },
        prerequisites: [
          {
            flagKey: 'retail.copilot.gemini-ui', // Retail flag! Not cards, not global platform
            variant: 'on'
          }
        ],
        description: 'Illegal dependency across tenant boundaries'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Cross-tenant prerequisite violation');
  });

  test('Both canonical and legacy alias keys evaluate to identical valid results', async () => {
    const context = {
      targetingKey: 'user-sg-vip',
      country: 'SG',
      userTier: 'PREMIUM'
    };

    const [canonicalRes, legacyRes] = await Promise.all([
      request(app).post('/ofrep/v1/evaluate/flags/retail.copilot.gemini-ui').send({ context }),
      request(app).post('/ofrep/v1/evaluate/flags/feature.chatbot-gemini-ui').send({ context })
    ]);

    expect(canonicalRes.statusCode).toBe(200);
    expect(legacyRes.statusCode).toBe(200);
    expect(canonicalRes.body.value).toBe(true);
    expect(legacyRes.body.value).toBe(true);
  });
});
