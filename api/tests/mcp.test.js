const { createMcpServer } = require('../src/mcp/server');
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

describe('OpenFeature MCP Server Tool Suite', () => {
  let server;

  beforeEach(() => {
    server = createMcpServer();
  });

  test('MCP server initializes with registered tools', () => {
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  test('Direct tool handlers return expected responses', async () => {
    const flagService = require('../src/services/flagService');

    // Test get_downstream_dependents
    const downstream = await flagService.getDownstreamDependents('feature.chatbot-gemini-ui');
    expect(Array.isArray(downstream)).toBe(true);
    expect(downstream.some(d => d.flagKey === 'feature.advanced-financial-insights')).toBe(true);

    // Test get_dependency_graph
    const graph = await flagService.getFullDependencyGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
