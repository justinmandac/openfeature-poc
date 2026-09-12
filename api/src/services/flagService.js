const db = require('../db/connection');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const flagEvents = require('./eventEmitter');
const schedulerService = require('./schedulerService');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function validateAgainstSchema(schemaObj, variants) {
  let validate;
  try {
    validate = ajv.compile(schemaObj);
  } catch (err) {
    throw new Error(`Invalid JSON Schema definition: ${err.message}`);
  }

  for (const [variantKey, variantVal] of Object.entries(variants)) {
    const valid = validate(variantVal);
    if (!valid) {
      const errorDetails = validate.errors.map(e => `${e.instancePath || 'root'} ${e.message}`).join(', ');
      throw new Error(`Variant "${variantKey}" failed schema validation: ${errorDetails}`);
    }
  }
}

function calculateAge(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatFlagRow(row) {
  if (!row) return null;
  return {
    ...row,
    variants: typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules || '[]') : (row.rules || []),
    prerequisites: typeof row.prerequisites === 'string' ? JSON.parse(row.prerequisites || '[]') : (row.prerequisites || []),
    schema: row.schema && typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema,
    app_tags: typeof row.app_tags === 'string' ? JSON.parse(row.app_tags || '[]') : (row.app_tags || []),
    lifecycle_state: row.lifecycle_state || row.state || 'ENABLED',
    age: calculateAge(row.created_at)
  };
}

function formatSegmentRow(row) {
  if (!row) return null;
  return {
    ...row,
    condition: typeof row.condition === 'string' ? JSON.parse(row.condition) : row.condition
  };
}

class FlagService {
  constructor() {
    schedulerService.setFlagService(this);
  }

  async getAllFlags(filters = {}) {
    let query = db('flags').select('*').orderBy('key', 'asc');

    const rows = await query;
    let flags = rows.map(formatFlagRow);

    if (filters.appTag) {
      flags = flags.filter(f => f.app_tags.includes(filters.appTag));
    }
    if (filters.type) {
      flags = flags.filter(f => f.type === filters.type);
    }
    if (filters.state) {
      flags = flags.filter(f => f.state === filters.state);
    }
    if (filters.lifecycleState) {
      flags = flags.filter(f => f.lifecycle_state === filters.lifecycleState);
    }
    // Filter out ARCHIVED from active lists unless explicitly requested
    if (!filters.includeArchived) {
      flags = flags.filter(f => f.lifecycle_state !== 'ARCHIVED');
    }

    return flags;
  }

  async getFlagByKey(key) {
    const row = await db('flags').where({ key }).first();
    return formatFlagRow(row);
  }

  async getEvaluationContextMaps() {
    const [flags, segments] = await Promise.all([
      db('flags').select('*'),
      db('segments').select('*')
    ]);

    const allFlagsMap = {};
    for (const f of flags) {
      allFlagsMap[f.key] = formatFlagRow(f);
    }

    const segmentsMap = {};
    for (const s of segments) {
      segmentsMap[s.id] = formatSegmentRow(s);
    }

    return { allFlagsMap, segmentsMap };
  }

  async createFlag(data, author = 'admin') {
    const {
      key,
      type,
      state = 'ENABLED',
      lifecycle_state = 'ENABLED',
      default_variant,
      variants,
      rules = [],
      prerequisites = [],
      schema = null,
      app_tags = ['webapp', 'bff'],
      description
    } = data;

    if (!key || !type || !default_variant || !variants || !description) {
      throw new Error('Missing required fields: key, type, default_variant, variants, description');
    }

    if (variants[default_variant] === undefined) {
      throw new Error(`Default variant "${default_variant}" must exist in defined variants`);
    }

    if (schema) {
      validateAgainstSchema(typeof schema === 'string' ? JSON.parse(schema) : schema, variants);
    }

    const existing = await db('flags').where({ key }).first();
    if (existing) {
      throw new Error(`Flag with key "${key}" already exists`);
    }

    const newRecord = {
      key,
      type,
      state,
      lifecycle_state,
      default_variant,
      variants: JSON.stringify(variants),
      rules: JSON.stringify(rules),
      prerequisites: JSON.stringify(prerequisites),
      schema: schema ? JSON.stringify(schema) : null,
      app_tags: JSON.stringify(app_tags),
      description,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('flags').insert(newRecord);

    await db('flag_history').insert({
      flag_key: key,
      version: 1,
      snapshot: JSON.stringify(newRecord),
      diff: JSON.stringify({ action: 'CREATED', state: newRecord }),
      author,
      change_reason: data.change_reason || 'Initial creation',
      created_at: new Date().toISOString()
    });

    flagEvents.broadcastChange({
      key,
      action: 'CREATED',
      version: 1,
      appTags: app_tags
    });

    return this.getFlagByKey(key);
  }

  async updateFlag(key, updates, author = 'admin', reason = 'Update flag configuration') {
    const existing = await this.getFlagByKey(key);
    if (!existing) {
      throw new Error(`Flag with key "${key}" not found`);
    }

    if (existing.lifecycle_state === 'GRADUATED' && updates.lifecycle_state !== 'ENABLED') {
      throw new Error(`Flag "${key}" is GRADUATED (frozen read-only). You must un-graduate it before changing configuration.`);
    }

    const merged = {
      ...existing,
      ...updates
    };

    if (merged.variants[merged.default_variant] === undefined) {
      throw new Error(`Default variant "${merged.default_variant}" must exist in defined variants`);
    }

    if (merged.schema) {
      validateAgainstSchema(merged.schema, merged.variants);
    }

    const nextVersion = (existing.version || 1) + 1;
    const updateRecord = {
      type: merged.type,
      state: merged.state,
      lifecycle_state: merged.lifecycle_state || merged.state,
      default_variant: merged.default_variant,
      graduated_variant: merged.graduated_variant || null,
      variants: JSON.stringify(merged.variants),
      rules: JSON.stringify(merged.rules),
      prerequisites: JSON.stringify(merged.prerequisites || []),
      schema: merged.schema ? JSON.stringify(merged.schema) : null,
      app_tags: JSON.stringify(merged.app_tags),
      description: merged.description,
      version: nextVersion,
      updated_at: new Date().toISOString()
    };

    const diff = {
      action: 'UPDATED',
      previous_version: existing.version,
      next_version: nextVersion,
      changes: {}
    };

    for (const prop of ['state', 'lifecycle_state', 'default_variant', 'variants', 'rules', 'prerequisites', 'schema', 'app_tags', 'description']) {
      if (JSON.stringify(existing[prop]) !== JSON.stringify(merged[prop])) {
        diff.changes[prop] = {
          from: existing[prop],
          to: merged[prop]
        };
      }
    }

    await db('flags').where({ key }).update(updateRecord);

    await db('flag_history').insert({
      flag_key: key,
      version: nextVersion,
      snapshot: JSON.stringify({ ...updateRecord, key, created_at: existing.created_at }),
      diff: JSON.stringify(diff),
      author,
      change_reason: reason,
      created_at: new Date().toISOString()
    });

    flagEvents.broadcastChange({
      key,
      action: 'UPDATED',
      version: nextVersion,
      appTags: merged.app_tags
    });

    return this.getFlagByKey(key);
  }

  async deleteFlag(key, author = 'admin', reason = 'Delete flag') {
    const existing = await this.getFlagByKey(key);
    if (!existing) {
      throw new Error(`Flag with key "${key}" not found`);
    }

    await db('flags').where({ key }).del();

    const nextVersion = (existing.version || 1) + 1;
    await db('flag_history').insert({
      flag_key: key,
      version: nextVersion,
      snapshot: JSON.stringify(existing),
      diff: JSON.stringify({ action: 'DELETED', deleted_state: existing }),
      author,
      change_reason: reason,
      created_at: new Date().toISOString()
    });

    flagEvents.broadcastChange({
      key,
      action: 'DELETED',
      version: nextVersion,
      appTags: existing.app_tags
    });

    return { success: true, key };
  }

  async getFlagHistory(key, limit = 5) {
    const rows = await db('flag_history')
      .where({ flag_key: key })
      .orderBy('version', 'desc')
      .limit(limit);

    return rows.map(r => ({
      ...r,
      snapshot: typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot,
      diff: typeof r.diff === 'string' ? JSON.parse(r.diff) : r.diff,
      age: calculateAge(r.created_at)
    }));
  }

  // --- Segments Management ---
  async getAllSegments() {
    const rows = await db('segments').select('*').orderBy('name', 'asc');
    return rows.map(formatSegmentRow);
  }

  async createSegment(data) {
    const { id, name, description, condition } = data;
    if (!id || !name || !condition) {
      throw new Error('Missing required fields for segment: id, name, condition');
    }

    const existing = await db('segments').where({ id }).first();
    if (existing) {
      throw new Error(`Segment with ID "${id}" already exists`);
    }

    const record = {
      id,
      name,
      description: description || '',
      condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('segments').insert(record);
    return formatSegmentRow(record);
  }

  async updateSegment(id, updates) {
    const existing = await db('segments').where({ id }).first();
    if (!existing) {
      throw new Error(`Segment "${id}" not found`);
    }

    const updateRecord = {
      name: updates.name || existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      condition: updates.condition ? (typeof updates.condition === 'string' ? updates.condition : JSON.stringify(updates.condition)) : existing.condition,
      updated_at: new Date().toISOString()
    };

    await db('segments').where({ id }).update(updateRecord);
    const updated = await db('segments').where({ id }).first();
    return formatSegmentRow(updated);
  }

  async deleteSegment(id) {
    await db('segments').where({ id }).del();
    return { success: true, id };
  }
}

module.exports = new FlagService();
