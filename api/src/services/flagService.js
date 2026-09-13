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
    shared_channels: typeof row.shared_channels === 'string' ? JSON.parse(row.shared_channels || '["web"]') : (row.shared_channels || ['web']),
    is_global: Boolean(row.is_global),
    business_unit_id: row.business_unit_id || 'bu-platform',
    app_id: row.app_id || 'app-platform-portal',
    lifecycle_state: row.lifecycle_state || row.state || 'ENABLED',
    age: calculateAge(row.created_at)
  };
}

function formatSegmentRow(row) {
  if (!row) return null;
  return {
    ...row,
    condition: typeof row.condition === 'string' ? JSON.parse(row.condition) : row.condition,
    isGlobal: !row.business_unit_id
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
    if (filters.businessUnitId || filters.bu) {
      const buTarget = filters.businessUnitId || filters.bu;
      flags = flags.filter(
        f => f.business_unit_id === buTarget || f.business_unit_id === `bu-${buTarget}` || (filters.includeGlobal && f.is_global)
      );
    }
    if (filters.appId) {
      flags = flags.filter(f => f.app_id === filters.appId || f.app_id === `app-${filters.appId}`);
    }
    if (filters.channel) {
      flags = flags.filter(f => f.is_global || (f.shared_channels && f.shared_channels.includes(filters.channel)));
    }
    if (filters.isGlobal !== undefined) {
      const isGlobalBool = filters.isGlobal === true || filters.isGlobal === 'true';
      flags = flags.filter(f => f.is_global === isGlobalBool);
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
    let row = await db('flags').where({ key }).first();
    if (!row) {
      row = await db('flags').where({ legacy_key: key }).first();
    }
    return formatFlagRow(row);
  }

  async getEvaluationContextMaps() {
    const [flags, segments] = await Promise.all([
      db('flags').select('*'),
      db('segments').select('*')
    ]);

    const allFlagsMap = {};
    for (const f of flags) {
      const formatted = formatFlagRow(f);
      allFlagsMap[f.key] = formatted;
      if (f.legacy_key) {
        allFlagsMap[f.legacy_key] = formatted;
      }
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

    const business_unit_id = data.business_unit_id || 'bu-retail';
    const app_id = data.app_id || 'app-retail-copilot';
    const shared_channels = data.shared_channels || ['web'];
    const is_global = Boolean(data.is_global);
    const legacy_key = data.legacy_key || null;

    // Validate cross-tenant prerequisites if any
    if (Array.isArray(prerequisites) && prerequisites.length > 0) {
      for (const p of prerequisites) {
        const prereqFlag = await this.getFlagByKey(p.flagKey);
        if (prereqFlag) {
          const isSameBu = prereqFlag.business_unit_id === business_unit_id;
          const isPrereqGlobal = prereqFlag.is_global || prereqFlag.business_unit_id === 'bu-platform';
          if (!isSameBu && !isPrereqGlobal) {
            throw new Error(
              `Cross-tenant prerequisite violation: Flag "${key}" (in "${business_unit_id}") cannot depend on flag "${p.flagKey}" belonging to different Business Unit "${prereqFlag.business_unit_id}". Prerequisites must be within the same Business Unit or reference a global platform flag.`
            );
          }
        }
      }
    }

    const newRecord = {
      key,
      legacy_key,
      business_unit_id,
      app_id,
      shared_channels: JSON.stringify(shared_channels),
      is_global,
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
      business_unit_id,
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

    // Validate cross-tenant prerequisites only if explicitly updated
    if (updates.prerequisites !== undefined && Array.isArray(updates.prerequisites) && updates.prerequisites.length > 0) {
      const bu = merged.business_unit_id || existing.business_unit_id;
      for (const p of merged.prerequisites) {
        const prereqFlag = await this.getFlagByKey(p.flagKey);
        if (prereqFlag) {
          const isSameBu = prereqFlag.business_unit_id === bu;
          const isPrereqGlobal = prereqFlag.is_global || prereqFlag.business_unit_id === 'bu-platform';
          if (!isSameBu && !isPrereqGlobal) {
            throw new Error(
              `Cross-tenant prerequisite violation: Flag "${key}" (in "${bu}") cannot depend on flag "${p.flagKey}" belonging to different Business Unit "${prereqFlag.business_unit_id}". Prerequisites must be within the same Business Unit or reference a global platform flag.`
            );
          }
        }
      }
    }

    const nextVersion = (existing.version || 1) + 1;
    const updateRecord = {
      business_unit_id: merged.business_unit_id || existing.business_unit_id,
      app_id: merged.app_id || existing.app_id,
      shared_channels: JSON.stringify(merged.shared_channels || existing.shared_channels),
      is_global: merged.is_global !== undefined ? Boolean(merged.is_global) : existing.is_global,
      legacy_key: merged.legacy_key !== undefined ? merged.legacy_key : existing.legacy_key,
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

    for (const prop of ['state', 'lifecycle_state', 'default_variant', 'variants', 'rules', 'prerequisites', 'schema', 'app_tags', 'description', 'business_unit_id', 'app_id', 'shared_channels', 'is_global']) {
      if (JSON.stringify(existing[prop]) !== JSON.stringify(merged[prop])) {
        diff.changes[prop] = {
          from: existing[prop],
          to: merged[prop]
        };
      }
    }

    await db('flags').where({ key: existing.key }).update(updateRecord);

    // Synchronize to alias flag if one exists (bidirectional canonical <-> legacy alias)
    const aliasKeys = [];
    if (existing.legacy_key) {
      aliasKeys.push(existing.legacy_key);
    }
    const matchingAliases = await db('flags')
      .where({ legacy_key: existing.key })
      .select('key');
    for (const row of matchingAliases) {
      if (row.key !== existing.key && !aliasKeys.includes(row.key)) {
        aliasKeys.push(row.key);
      }
    }

    for (const aKey of aliasKeys) {
      await db('flags').where({ key: aKey }).update({
        state: updateRecord.state,
        lifecycle_state: updateRecord.lifecycle_state,
        default_variant: updateRecord.default_variant,
        variants: updateRecord.variants,
        rules: updateRecord.rules,
        version: nextVersion,
        updated_at: updateRecord.updated_at
      });

      flagEvents.broadcastChange({
        key: aKey,
        action: 'UPDATED',
        version: nextVersion,
        appTags: merged.app_tags
      });
    }

    await db('flag_history').insert({
      flag_key: existing.key,
      business_unit_id: updateRecord.business_unit_id,
      version: nextVersion,
      snapshot: JSON.stringify({ ...updateRecord, key: existing.key, created_at: existing.created_at }),
      diff: JSON.stringify(diff),
      author,
      change_reason: reason,
      created_at: new Date().toISOString()
    });

    flagEvents.broadcastChange({
      key: existing.key,
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

  /**
   * Builds an inverted dependency graph mapping each upstream flag to its direct dependents.
   * Map: upstreamFlagKey -> [ { dependentKey, requiredVariant, type, appTags, description } ]
   */
  async getInvertedDependencyGraph() {
    const flags = await this.getAllFlags();
    const invertedMap = {};

    for (const flag of flags) {
      for (const prereq of flag.prerequisites || []) {
        if (!invertedMap[prereq.flagKey]) {
          invertedMap[prereq.flagKey] = [];
        }
        invertedMap[prereq.flagKey].push({
          dependentKey: flag.key,
          requiredVariant: prereq.variant,
          type: flag.type,
          state: flag.state,
          lifecycleState: flag.lifecycle_state,
          appTags: flag.app_tags,
          description: flag.description
        });
      }
    }

    return invertedMap;
  }

  /**
   * Traverses all direct and transitive downstream dependents for a given flag.
   */
  async getDownstreamDependents(flagKey) {
    const flags = await this.getAllFlags();
    const flagsByKey = {};
    for (const f of flags) {
      flagsByKey[f.key] = f;
    }

    const invertedMap = {};
    for (const f of flags) {
      for (const prereq of f.prerequisites || []) {
        if (!invertedMap[prereq.flagKey]) {
          invertedMap[prereq.flagKey] = [];
        }
        invertedMap[prereq.flagKey].push({
          flagKey: f.key,
          requiredVariant: prereq.variant
        });
      }
    }

    const visited = new Set();
    const dependents = [];

    function traverse(currentKey, depth = 1) {
      const direct = invertedMap[currentKey] || [];
      for (const item of direct) {
        if (!visited.has(item.flagKey)) {
          visited.add(item.flagKey);
          const flagObj = flagsByKey[item.flagKey];
          dependents.push({
            flagKey: item.flagKey,
            depth,
            requiredVariant: item.requiredVariant,
            type: flagObj?.type,
            lifecycleState: flagObj?.lifecycle_state,
            appTags: flagObj?.app_tags || [],
            description: flagObj?.description || ''
          });
          traverse(item.flagKey, depth + 1);
        }
      }
    }

    traverse(flagKey, 1);
    return dependents;
  }

  /**
   * Traverses all direct and transitive upstream prerequisites required by a given flag.
   */
  async getUpstreamPrerequisites(flagKey) {
    const flag = await this.getFlagByKey(flagKey);
    if (!flag) return [];

    const flags = await this.getAllFlags();
    const flagsByKey = {};
    for (const f of flags) {
      flagsByKey[f.key] = f;
    }

    const visited = new Set();
    const prerequisitesList = [];

    function traverse(currentFlag, depth = 1) {
      for (const prereq of currentFlag.prerequisites || []) {
        if (!visited.has(prereq.flagKey)) {
          visited.add(prereq.flagKey);
          const upstreamFlag = flagsByKey[prereq.flagKey];
          prerequisitesList.push({
            flagKey: prereq.flagKey,
            depth,
            requiredVariant: prereq.variant,
            currentVariant: upstreamFlag?.default_variant,
            lifecycleState: upstreamFlag?.lifecycle_state,
            description: upstreamFlag?.description || ''
          });
          if (upstreamFlag) {
            traverse(upstreamFlag, depth + 1);
          }
        }
      }
    }

    traverse(flag, 1);
    return prerequisitesList;
  }

  /**
   * Returns complete dependency graph with nodes and edges across the entire catalog.
   */
  async getFullDependencyGraph() {
    const flags = await this.getAllFlags();
    const nodes = [];
    const edges = [];

    for (const flag of flags) {
      nodes.push({
        id: flag.key,
        label: flag.key,
        type: flag.type,
        lifecycleState: flag.lifecycle_state,
        appTags: flag.app_tags,
        defaultVariant: flag.default_variant
      });

      for (const prereq of flag.prerequisites || []) {
        edges.push({
          source: prereq.flagKey,
          target: flag.key,
          requiredVariant: prereq.variant
        });
      }
    }

    return { nodes, edges };
  }
}

module.exports = new FlagService();
