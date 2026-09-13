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

describe('Agentic Impact Assessment & Graph Traversal Engine', () => {
  test('GET /api/v1/admin/flags/:key/dependents returns downstream dependents and upstream prerequisites', async () => {
    // feature.advanced-financial-insights depends on feature.chatbot-gemini-ui == on
    const res = await request(app).get('/api/v1/admin/flags/feature.chatbot-gemini-ui/dependents');

    expect(res.statusCode).toBe(200);
    expect(res.body.flagKey).toBe('feature.chatbot-gemini-ui');
    expect(Array.isArray(res.body.downstream)).toBe(true);

    const hasInsightsDependent = res.body.downstream.some(
      (d) => d.flagKey === 'feature.advanced-financial-insights' && d.requiredVariant === 'on'
    );
    expect(hasInsightsDependent).toBe(true);
    expect(res.body.directDependentsCount).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/v1/admin/flags/:key/dependents returns upstream prerequisites correctly', async () => {
    const res = await request(app).get('/api/v1/admin/flags/feature.advanced-financial-insights/dependents');

    expect(res.statusCode).toBe(200);
    expect(res.body.flagKey).toBe('feature.advanced-financial-insights');
    expect(Array.isArray(res.body.upstream)).toBe(true);

    const hasChatbotPrereq = res.body.upstream.some(
      (p) => p.flagKey === 'feature.chatbot-gemini-ui'
    );
    expect(hasChatbotPrereq).toBe(true);
  });

  test('GET /api/v1/admin/graph/dependencies returns full nodes and directed edges', async () => {
    const res = await request(app).get('/api/v1/admin/graph/dependencies');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);

    expect(res.body.nodes.length).toBeGreaterThan(0);
    const edge = res.body.edges.find(
      (e) => e.source === 'feature.chatbot-gemini-ui' && e.target === 'feature.advanced-financial-insights'
    );
    expect(edge).toBeDefined();
    expect(edge.requiredVariant).toBe('on');
  });

  test('POST /api/v1/admin/simulate-impact detects downstream prerequisite failure and blast radius', async () => {
    // Check initial state before simulation
    const initialFlag = await db('flags').where({ key: 'feature.chatbot-gemini-ui' }).first();
    const initialVersion = initialFlag.version;

    // Proposed mutation: Turn feature.chatbot-gemini-ui completely DISABLED
    const proposedMutation = {
      key: 'feature.chatbot-gemini-ui',
      type: 'BOOLEAN',
      state: 'DISABLED',
      lifecycle_state: 'DISABLED',
      default_variant: 'off',
      variants: { on: true, off: false },
      rules: [],
      prerequisites: [],
      app_tags: ['webapp', 'bff'],
      description: 'Disabling Gemini Chatbot to test downstream blast radius'
    };

    const res = await request(app)
      .post('/api/v1/admin/simulate-impact')
      .send({
        proposedFlag: proposedMutation
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.targetFlagKey).toBe('feature.chatbot-gemini-ui');
    expect(res.body.totalContextsEvaluated).toBeGreaterThan(0);
    expect(res.body.blastRadiusPercentage).toBeGreaterThan(0);

    // Downstream feature.advanced-financial-insights requires chatbot == on, so it must fail prerequisites!
    const downstreamInsights = res.body.downstreamImpacts.find(
      (d) => d.flagKey === 'feature.advanced-financial-insights'
    );
    expect(downstreamInsights).toBeDefined();
    expect(downstreamInsights.prerequisiteFailures).toBeGreaterThan(0);
    expect(res.body.riskRating).toBe('HIGH');

    // Verify statelessness: Database was NOT modified
    const flagAfter = await db('flags').where({ key: 'feature.chatbot-gemini-ui' }).first();
    expect(flagAfter.version).toBe(initialVersion);
    expect(flagAfter.state).toBe(initialFlag.state);
  });
});
