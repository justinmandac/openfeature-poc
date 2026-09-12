const { getBucketValue } = require('./hash');

/**
 * Evaluates an OpenFeature flag against an Evaluation Context, supporting
 * Lifecycle states, Prerequisites, Segments, Percentage rollouts, and Rule priorities.
 *
 * @param {Object} flag The flag record from the database.
 * @param {Object} context The evaluation context passed from client/BFF.
 * @param {Object} options Optional evaluation options: { allFlagsMap, segmentsMap }
 * @returns {Object} OFREP evaluation result: { key, value, reason, variant, metadata }
 */
function evaluateFlag(flag, context = {}, options = {}) {
  const { allFlagsMap = {}, segmentsMap = {} } = options;

  const variants = typeof flag.variants === 'string' ? JSON.parse(flag.variants) : flag.variants;
  const rules = typeof flag.rules === 'string' ? JSON.parse(flag.rules || '[]') : (flag.rules || []);
  const prerequisites = typeof flag.prerequisites === 'string' 
    ? JSON.parse(flag.prerequisites || '[]') 
    : (flag.prerequisites || []);
  const defaultVariant = flag.default_variant;
  const lifecycleState = flag.lifecycle_state || flag.state || 'ENABLED';

  // 1. Check Lifecycle State: DRAFT
  if (lifecycleState === 'DRAFT') {
    return {
      key: flag.key,
      value: variants[defaultVariant] !== undefined ? variants[defaultVariant] : null,
      reason: 'DEFAULT',
      variant: defaultVariant,
      metadata: {
        flagType: flag.type,
        lifecycleState: 'DRAFT',
        version: flag.version
      }
    };
  }

  // 2. Check Lifecycle State: GRADUATED (Permanent / Frozen)
  if (lifecycleState === 'GRADUATED') {
    const gradVariant = flag.graduated_variant || defaultVariant;
    return {
      key: flag.key,
      value: variants[gradVariant] !== undefined ? variants[gradVariant] : null,
      reason: 'STATIC',
      variant: gradVariant,
      metadata: {
        flagType: flag.type,
        lifecycleState: 'GRADUATED',
        version: flag.version,
        graduated: true
      }
    };
  }

  // 3. Check Lifecycle State: DISABLED or ARCHIVED
  if (lifecycleState === 'DISABLED' || lifecycleState === 'ARCHIVED' || flag.state === 'DISABLED') {
    const fallbackValue = variants[defaultVariant] !== undefined ? variants[defaultVariant] : null;
    return {
      key: flag.key,
      value: fallbackValue,
      reason: 'DISABLED',
      variant: defaultVariant,
      metadata: {
        flagType: flag.type,
        lifecycleState,
        version: flag.version
      }
    };
  }

  // 4. Check Prerequisites (Flag Dependencies)
  for (const prereq of prerequisites) {
    const prereqFlag = allFlagsMap[prereq.flagKey];
    if (prereqFlag) {
      // Evaluate prerequisite flag with same context (without infinite recursion cycle)
      const prereqEval = evaluateFlag(prereqFlag, context, {
        allFlagsMap: { ...allFlagsMap, [flag.key]: null },
        segmentsMap
      });

      if (prereqEval.variant !== prereq.variant) {
        return {
          key: flag.key,
          value: variants[defaultVariant] !== undefined ? variants[defaultVariant] : null,
          reason: 'PREREQUISITE_FAILED',
          variant: defaultVariant,
          metadata: {
            flagType: flag.type,
            unmetPrerequisite: prereq.flagKey,
            requiredVariant: prereq.variant,
            actualVariant: prereqEval.variant,
            version: flag.version
          }
        };
      }
    }
  }

  // 5. Evaluate Targeting Rules in Priority Order (1 is highest priority)
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    if (matchesCondition(rule.condition, context, segmentsMap)) {
      // Check for Percentage / Fractional Rollout in rule
      if (rule.rollout && typeof rule.rollout.percentage === 'number') {
        const targetingKey = context[rule.rollout.attribute] || context.targetingKey || 'anonymous';
        const bucket = getBucketValue(flag.key, targetingKey);
        const withinRollout = bucket < rule.rollout.percentage;
        const resolvedVariant = withinRollout 
          ? (rule.rollout.variant || rule.variant)
          : (rule.rollout.fallbackVariant || defaultVariant);

        return {
          key: flag.key,
          value: variants[resolvedVariant] !== undefined ? variants[resolvedVariant] : null,
          reason: 'TARGETING_MATCH',
          variant: resolvedVariant,
          metadata: {
            ruleId: rule.id || null,
            rulePriority: rule.priority || null,
            flagType: flag.type,
            rollout: true,
            percentage: rule.rollout.percentage,
            bucket,
            version: flag.version
          }
        };
      }

      const matchedVariant = rule.variant;
      const value = variants[matchedVariant];

      if (value !== undefined) {
        return {
          key: flag.key,
          value,
          reason: 'TARGETING_MATCH',
          variant: matchedVariant,
          metadata: {
            ruleId: rule.id || null,
            rulePriority: rule.priority || null,
            flagType: flag.type,
            version: flag.version
          }
        };
      }
    }
  }

  // 6. Default Variant Fallback
  const defaultValue = variants[defaultVariant];
  return {
    key: flag.key,
    value: defaultValue !== undefined ? defaultValue : null,
    reason: 'DEFAULT',
    variant: defaultVariant,
    metadata: {
      flagType: flag.type,
      version: flag.version
    }
  };
}

/**
 * Checks if context matches condition, including nested conditions and reusable segments.
 */
function matchesCondition(condition, context, segmentsMap = {}) {
  if (!condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
    return false;
  }

  // Reusable Segment Reference: { segmentId: 'segment-apac-premier' } or { segment: '...' }
  const segmentId = condition.segmentId || condition.segment;
  if (segmentId) {
    const segment = segmentsMap[segmentId];
    if (segment) {
      const segmentCondition = typeof segment.condition === 'string' ? JSON.parse(segment.condition) : segment.condition;
      if (!matchesCondition(segmentCondition, context, segmentsMap)) {
        return false;
      }
    } else {
      return false; // Referenced segment not found
    }
  }

  for (const [key, expectedValue] of Object.entries(condition)) {
    if (key === 'segmentId' || key === 'segment') continue;

    const actualValue = context[key];

    if (Array.isArray(expectedValue)) {
      if (!expectedValue.includes(actualValue)) {
        return false;
      }
    } else if (typeof expectedValue === 'object' && expectedValue !== null) {
      if (expectedValue.in && Array.isArray(expectedValue.in)) {
        if (!expectedValue.in.includes(actualValue)) return false;
      }
      if (expectedValue.notIn && Array.isArray(expectedValue.notIn)) {
        if (expectedValue.notIn.includes(actualValue)) return false;
      }
      if (expectedValue.gt !== undefined) {
        if (typeof actualValue !== 'number' || actualValue <= expectedValue.gt) return false;
      }
      if (expectedValue.lt !== undefined) {
        if (typeof actualValue !== 'number' || actualValue >= expectedValue.lt) return false;
      }
    } else {
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

module.exports = {
  evaluateFlag,
  matchesCondition
};
