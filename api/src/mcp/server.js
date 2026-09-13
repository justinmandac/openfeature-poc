const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const flagService = require('../services/flagService');
const analyticsService = require('../services/analyticsService');
const { simulateBatchImpact, generateSyntheticContexts } = require('../engine/evaluator');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function createMcpServer() {
  const server = new McpServer({
    name: 'openfeature-impact-agent',
    version: '1.0.0'
  });

  // Tool 1: List Flags
  server.tool(
    'list_flags',
    'Lists all feature flags in the enterprise inventory with options to filter by scope, type, or lifecycle state.',
    {
      appTag: z.string().optional().describe('Filter by application scope (e.g. webapp, bff, api)'),
      type: z.enum(['BOOLEAN', 'OBJECT', 'STRING', 'NUMBER']).optional().describe('Filter by evaluation type'),
      lifecycleState: z.enum(['ENABLED', 'DISABLED', 'DRAFT', 'GRADUATED', 'ARCHIVED']).optional().describe('Filter by lifecycle state')
    },
    async ({ appTag, type, lifecycleState }) => {
      const flags = await flagService.getAllFlags({
        appTag,
        type,
        lifecycleState
      });

      const summaries = flags.map(f => ({
        key: f.key,
        type: f.type,
        lifecycle_state: f.lifecycle_state,
        default_variant: f.default_variant,
        app_tags: f.app_tags,
        prerequisites_count: (f.prerequisites || []).length,
        rules_count: (f.rules || []).length,
        description: f.description
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summaries, null, 2)
          }
        ]
      };
    }
  );

  // Tool 2: Get Flag Details
  server.tool(
    'get_flag_details',
    'Retrieves the full configuration for a specific flag including rules hierarchy, variants, prerequisites, and JSON schema.',
    {
      flagKey: z.string().describe('The unique identifier of the flag (e.g. feature.chatbot-gemini-ui)')
    },
    async ({ flagKey }) => {
      const flag = await flagService.getFlagByKey(flagKey);
      if (!flag) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Flag with key "${flagKey}" not found.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(flag, null, 2)
          }
        ]
      };
    }
  );

  // Tool 3: Get Downstream Dependents
  server.tool(
    'get_downstream_dependents',
    'Identifies all flags across the enterprise catalog that depend on this flag as an upstream prerequisite.',
    {
      flagKey: z.string().describe('The flag key to inspect for downstream dependents')
    },
    async ({ flagKey }) => {
      const [downstream, upstream] = await Promise.all([
        flagService.getDownstreamDependents(flagKey),
        flagService.getUpstreamPrerequisites(flagKey)
      ]);

      const result = {
        flagKey,
        directDependentsCount: downstream.filter(d => d.depth === 1).length,
        totalTransitiveDependents: downstream.length,
        downstreamDependents: downstream,
        upstreamPrerequisites: upstream
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Tool 4: Get Dependency Graph
  server.tool(
    'get_dependency_graph',
    'Returns the complete Directed Acyclic Graph (DAG) of prerequisite flag dependencies across the entire inventory.',
    {},
    async () => {
      const graph = await flagService.getFullDependencyGraph();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(graph, null, 2)
          }
        ]
      };
    }
  );

  // Tool 5: Simulate Flag Impact
  server.tool(
    'simulate_flag_impact',
    'Statelessly simulates the blast radius of modifying a flag before deployment. Evaluates synthetic banking cohorts and detects downstream prerequisite failures without mutating the database.',
    {
      flagKey: z.string().describe('Flag key being modified'),
      proposedState: z.enum(['ENABLED', 'DISABLED', 'DRAFT', 'GRADUATED']).optional().describe('Proposed lifecycle/state'),
      proposedDefaultVariant: z.string().optional().describe('Proposed fallback default variant'),
      proposedVariantsJson: z.string().optional().describe('Optional proposed variants JSON string'),
      proposedRulesJson: z.string().optional().describe('Optional proposed rules JSON string')
    },
    async ({ flagKey, proposedState, proposedDefaultVariant, proposedVariantsJson, proposedRulesJson }) => {
      const currentFlag = await flagService.getFlagByKey(flagKey);
      if (!currentFlag) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Flag with key "${flagKey}" not found.`
            }
          ]
        };
      }

      const proposedFlag = {
        ...currentFlag,
        state: (proposedState === 'ENABLED' || proposedState === 'GRADUATED') ? 'ENABLED' : (proposedState || currentFlag.state),
        lifecycle_state: proposedState || currentFlag.lifecycle_state,
        default_variant: proposedDefaultVariant || currentFlag.default_variant
      };

      if (proposedVariantsJson) {
        try {
          proposedFlag.variants = JSON.parse(proposedVariantsJson);
        } catch (e) {
          return { content: [{ type: 'text', text: `Invalid proposedVariantsJson: ${e.message}` }] };
        }
      }

      if (proposedRulesJson) {
        try {
          proposedFlag.rules = JSON.parse(proposedRulesJson);
        } catch (e) {
          return { content: [{ type: 'text', text: `Invalid proposedRulesJson: ${e.message}` }] };
        }
      }

      const { allFlagsMap, segmentsMap } = await flagService.getEvaluationContextMaps();
      const impact = simulateBatchImpact(proposedFlag, null, { allFlagsMap, segmentsMap });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(impact, null, 2)
          }
        ]
      };
    }
  );

  // Tool 6: Get Flag Telemetry
  server.tool(
    'get_flag_telemetry',
    'Retrieves real-time evaluation metrics, QPS, variant distribution, and business tracking events.',
    {
      flagKey: z.string().optional().describe('Optional flag key to filter metrics')
    },
    async ({ flagKey }) => {
      const summary = await analyticsService.getEvaluationSummary();
      let metrics = summary.flagMetrics || [];
      if (flagKey) {
        metrics = metrics.filter(m => m.flagKey === flagKey);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ flagMetrics: metrics, trackingEvents: summary.trackingEvents || [] }, null, 2)
          }
        ]
      };
    }
  );

  // Tool 7: Validate Variant Schema
  server.tool(
    'validate_variant_schema',
    'Validates an OBJECT variant payload against the flag JSON Schema (Draft 2020-12 / Draft 7).',
    {
      schemaJson: z.string().describe('JSON Schema specification string'),
      payloadJson: z.string().describe('Candidate variant payload JSON string to validate')
    },
    async ({ schemaJson, payloadJson }) => {
      try {
        const schema = JSON.parse(schemaJson);
        const payload = JSON.parse(payloadJson);
        const validate = ajv.compile(schema);
        const valid = validate(payload);

        if (valid) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ valid: true, message: 'Payload conforms to JSON Schema.' }) }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                valid: false,
                errors: validate.errors.map(e => `${e.instancePath || 'root'} ${e.message}`)
              })
            }]
          };
        }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Validation Error: ${err.message}` }]
        };
      }
    }
  );

  return server;
}

// Start stdio transport if invoked directly as CLI
if (require.main === module) {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('OpenFeature MCP Server running on stdio');
  }).catch((err) => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
  });
}

module.exports = { createMcpServer };
