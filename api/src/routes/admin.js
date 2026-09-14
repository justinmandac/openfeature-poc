const express = require('express');
const router = express.Router();
const flagService = require('../services/flagService');
const tenantService = require('../services/tenantService');
const schedulerService = require('../services/schedulerService');
const analyticsService = require('../services/analyticsService');
const { simulateBatchImpact } = require('../engine/evaluator');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * GET /api/v1/admin/business-units
 * Returns all Business Units with child application metadata and flag counts.
 */
router.get('/business-units', async (req, res) => {
  try {
    const businessUnits = await tenantService.getAllBusinessUnits();
    res.json({ businessUnits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/applications
 * Returns applications, optionally filtered by ?bu=...
 */
router.get('/applications', async (req, res) => {
  try {
    const { bu, businessUnitId } = req.query;
    const applications = await tenantService.getAllApplications({ bu: bu || businessUnitId });
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/flags
 */
router.get('/flags', async (req, res) => {
  try {
    const { appTag, type, state, lifecycleState, includeArchived, bu, businessUnitId, appId, channel } = req.query;
    const flags = await flagService.getAllFlags({
      appTag,
      type,
      state,
      lifecycleState,
      businessUnitId: bu || businessUnitId,
      appId,
      channel,
      includeArchived: includeArchived === 'true'
    });
    res.json({ flags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/flags/:key
 */
router.get('/flags/:key', async (req, res) => {
  try {
    const flag = await flagService.getFlagByKey(req.params.key);
    if (!flag) {
      return res.status(404).json({ error: `Flag "${req.params.key}" not found` });
    }
    res.json({ flag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/flags
 */
router.post('/flags', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const flag = await flagService.createFlag(req.body, author);
    res.status(201).json({ flag });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/admin/flags/:key
 */
router.put('/flags/:key', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const reason = req.body.change_reason || 'Updated via Admin Web App';
    const flag = await flagService.updateFlag(req.params.key, req.body, author, reason);
    res.json({ flag });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/admin/flags/:key/state (Quick toggle)
 */
router.patch('/flags/:key/state', async (req, res) => {
  try {
    const { state } = req.body;
    if (!['ENABLED', 'DISABLED'].includes(state)) {
      return res.status(400).json({ error: 'State must be ENABLED or DISABLED' });
    }
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const reason = `Toggled state to ${state}`;
    const flag = await flagService.updateFlag(req.params.key, {
      state,
      lifecycle_state: state === 'ENABLED' ? 'ENABLED' : 'DISABLED'
    }, author, reason);
    res.json({ flag });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/admin/flags/:key/lifecycle (Lifecycle transition: DRAFT, ENABLED, DISABLED, GRADUATED, ARCHIVED)
 */
router.patch('/flags/:key/lifecycle', async (req, res) => {
  try {
    const { lifecycle_state, graduated_variant } = req.body;
    const validStates = ['DRAFT', 'ENABLED', 'DISABLED', 'GRADUATED', 'ARCHIVED'];
    if (!validStates.includes(lifecycle_state)) {
      return res.status(400).json({ error: `Invalid lifecycle state. Must be one of: ${validStates.join(', ')}` });
    }

    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const reason = `Transitioned lifecycle state to ${lifecycle_state}`;

    const updatePayload = {
      lifecycle_state,
      state: (lifecycle_state === 'ENABLED' || lifecycle_state === 'GRADUATED') ? 'ENABLED' : 'DISABLED'
    };

    if (lifecycle_state === 'GRADUATED') {
      if (!graduated_variant) {
        return res.status(400).json({ error: 'Graduating a flag requires specifying graduated_variant' });
      }
      updatePayload.graduated_variant = graduated_variant;
    }

    const flag = await flagService.updateFlag(req.params.key, updatePayload, author, reason);
    res.json({ flag });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/admin/flags/:key
 */
router.delete('/flags/:key', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.query.author || 'admin-user';
    const reason = req.query.reason || 'Deleted via Admin Web App';
    const result = await flagService.deleteFlag(req.params.key, author, reason);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/flags/:key/history
 */
router.get('/flags/:key/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const history = await flagService.getFlagHistory(req.params.key, limit);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/flags/validate-schema
 */
router.post('/flags/validate-schema', (req, res) => {
  try {
    const { schema, payload } = req.body;
    if (!schema) {
      return res.status(400).json({ valid: false, error: 'No schema provided' });
    }

    const validate = ajv.compile(schema);
    const valid = validate(payload);

    if (!valid) {
      return res.json({
        valid: false,
        errors: validate.errors.map(e => `${e.instancePath || 'root'} ${e.message}`)
      });
    }

    return res.json({ valid: true });
  } catch (error) {
    return res.status(400).json({ valid: false, error: error.message });
  }
});

// --- Reusable Segments Endpoints ---
router.get('/segments', async (req, res) => {
  try {
    const segments = await flagService.getAllSegments();
    res.json({ segments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/segments', async (req, res) => {
  try {
    const segment = await flagService.createSegment(req.body);
    res.status(201).json({ segment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/segments/:id', async (req, res) => {
  try {
    const segment = await flagService.updateSegment(req.params.id, req.body);
    res.json({ segment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/segments/:id', async (req, res) => {
  try {
    const result = await flagService.deleteSegment(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Scheduled Changes Endpoints ---
router.get('/scheduled-changes', async (req, res) => {
  try {
    const changes = await schedulerService.getScheduledChanges(req.query.flagKey);
    res.json({ scheduledChanges: changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scheduled-changes', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const change = await schedulerService.scheduleChange({ ...req.body, author });
    res.status(201).json({ scheduledChange: change });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/scheduled-changes/:id', async (req, res) => {
  try {
    const result = await schedulerService.cancelScheduledChange(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Analytics & Stale Flags Hygiene Endpoints ---
router.get('/analytics', async (req, res) => {
  try {
    const summary = await analyticsService.getEvaluationSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hygiene', async (req, res) => {
  try {
    const flags = await flagService.getAllFlags({ includeArchived: true });
    const issues = await analyticsService.getFlagHygieneReport(flags);
    res.json({ hygieneIssues: issues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hygiene/export', async (req, res) => {
  try {
    const flags = await flagService.getAllFlags({ includeArchived: true });
    const markdownTicket = await analyticsService.generateCleanupSprintTicket(flags);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="flag-cleanup-sprint-${new Date().toISOString().slice(0, 10)}.md"`);
    res.send(markdownTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/flags/:key/evaluations', async (req, res) => {
  try {
    const details = await analyticsService.getFlagEvaluationDetails(req.params.key);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/flags/:key/archive', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const reason = req.body.reason || 'Archived dead flag during hygiene cleanup';
    const flag = await flagService.updateFlag(
      req.params.key,
      { state: 'DISABLED', lifecycle_state: 'ARCHIVED' },
      author,
      reason
    );
    res.json({ flag, message: `Flag ${req.params.key} successfully archived.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/flags/:key/graduate', async (req, res) => {
  try {
    const author = req.headers['x-author'] || req.body.author || 'admin-user';
    const { variant, reason } = req.body;
    const flag = await flagService.updateFlag(
      req.params.key,
      {
        lifecycle_state: 'GRADUATED',
        graduated_variant: variant || undefined
      },
      author,
      reason || `Graduated to variant "${variant || 'default'}" after 100% saturation`
    );
    res.json({ flag, message: `Flag ${req.params.key} successfully graduated.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Agentic Impact Assessment & Graph Traversal Endpoints ---

/**
 * GET /api/v1/admin/flags/:key/dependents
 * Returns direct and transitive downstream dependents and upstream prerequisites.
 */
router.get('/flags/:key/dependents', async (req, res) => {
  try {
    const { key } = req.params;
    const [downstream, upstream] = await Promise.all([
      flagService.getDownstreamDependents(key),
      flagService.getUpstreamPrerequisites(key)
    ]);
    res.json({
      flagKey: key,
      downstream,
      upstream,
      directDependentsCount: downstream.filter(d => d.depth === 1).length,
      transitiveDependentsCount: downstream.length,
      upstreamPrerequisitesCount: upstream.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/graph/dependencies
 * Returns complete dependency graph with nodes and directed edges for the entire catalog.
 */
router.get('/graph/dependencies', async (req, res) => {
  try {
    const graph = await flagService.getFullDependencyGraph();
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/simulate-impact
 * Performs an in-memory batch simulation of a proposed flag mutation across contexts.
 */
router.post('/simulate-impact', async (req, res) => {
  try {
    const { proposedFlag, testContexts } = req.body;
    if (!proposedFlag || !proposedFlag.key) {
      return res.status(400).json({ error: 'Missing required field: proposedFlag with key' });
    }

    const { allFlagsMap, segmentsMap } = await flagService.getEvaluationContextMaps();
    const result = simulateBatchImpact(proposedFlag, testContexts, { allFlagsMap, segmentsMap });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
