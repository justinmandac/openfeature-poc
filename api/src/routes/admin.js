const express = require('express');
const router = express.Router();
const flagService = require('../services/flagService');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * GET /api/v1/admin/flags
 */
router.get('/flags', async (req, res) => {
  try {
    const { appTag, type, state } = req.query;
    const flags = await flagService.getAllFlags({ appTag, type, state });
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
    const flag = await flagService.updateFlag(req.params.key, { state }, author, reason);
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

module.exports = router;
