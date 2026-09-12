/**
 * Evaluates an OpenFeature flag against a given Evaluation Context.
 * Conforms to OpenFeature Remote Evaluation Protocol (OFREP) specification.
 *
 * @param {Object} flag The flag record from the database.
 * @param {Object} context The evaluation context passed from client/BFF.
 * @returns {Object} OFREP evaluation result: { value, key, reason, variant, metadata }
 */
function evaluateFlag(flag, context = {}) {
  const variants = typeof flag.variants === 'string' ? JSON.parse(flag.variants) : flag.variants;
  const rules = typeof flag.rules === 'string' ? JSON.parse(flag.rules || '[]') : (flag.rules || []);
  const defaultVariant = flag.default_variant;

  // 1. Check if flag is DISABLED
  if (flag.state === 'DISABLED') {
    const fallbackValue = variants[defaultVariant] !== undefined ? variants[defaultVariant] : null;
    return {
      key: flag.key,
      value: fallbackValue,
      reason: 'DISABLED',
      variant: defaultVariant,
      metadata: {
        flagType: flag.type,
        version: flag.version
      }
    };
  }

  // 2. Evaluate targeting rules in priority order (1 is highest priority)
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    if (matchesCondition(rule.condition, context)) {
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

  // 3. If no targeting rule matched, fallback to default variant
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
 * Checks if an evaluation context matches a rule's condition criteria.
 * Supports:
 * - Simple equality: { country: 'SG' }
 * - TargetingKey matching: { targetingKey: 'user-beta-01' }
 * - Array inclusion: { country: ['SG', 'PH'] }
 * - Compound conditions: { country: 'SG', userTier: 'PREMIUM' }
 */
function matchesCondition(condition, context) {
  if (!condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
    return false;
  }

  for (const [key, expectedValue] of Object.entries(condition)) {
    const actualValue = context[key];

    if (Array.isArray(expectedValue)) {
      if (!expectedValue.includes(actualValue)) {
        return false;
      }
    } else if (typeof expectedValue === 'object' && expectedValue !== null) {
      // Comparison operator objects: { in: [...], notIn: [...], gt: 10, lt: 5 }
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
      // Direct equality check
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
