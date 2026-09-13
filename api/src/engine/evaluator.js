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
    let fallbackVariant = defaultVariant;
    let fallbackValue = variants[defaultVariant] !== undefined ? variants[defaultVariant] : null;

    // For BOOLEAN flags, a disabled state must always serve false / off
    if (flag.type === 'BOOLEAN') {
      if (variants['off'] !== undefined) {
        fallbackVariant = 'off';
        fallbackValue = variants['off'];
      } else {
        fallbackValue = false;
      }
    }

    return {
      key: flag.key,
      value: fallbackValue,
      reason: 'DISABLED',
      variant: fallbackVariant,
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

/**
 * Generates a representative synthetic matrix of banking evaluation contexts.
 */
function generateSyntheticContexts() {
  const countries = ['SG', 'HK', 'AE', 'IN'];
  const userTiers = ['VIP', 'PREMIUM', 'STANDARD'];
  const businessUnits = ['Wealth Management', 'Retail Banking', 'Treasury & Markets'];
  const appIds = ['webapp', 'bff'];

  const contexts = [];
  let userIndex = 1;

  for (const country of countries) {
    for (const userTier of userTiers) {
      for (const businessUnit of businessUnits) {
        const appId = appIds[userIndex % appIds.length];
        contexts.push({
          targetingKey: `user-${country.toLowerCase()}-${userTier.toLowerCase()}-${userIndex}`,
          country,
          userTier,
          businessUnit,
          appId,
          environment: 'PROD-US-EAST'
        });
        userIndex++;
      }
    }
  }

  return contexts;
}

/**
 * Performs a stateless batch simulation comparing the current flag catalog
 * against a proposed hypothetical flag mutation across a matrix of contexts.
 *
 * @param {Object} proposedFlag The draft/modified flag object.
 * @param {Array} testContexts Optional array of contexts. If omitted, uses standard synthetic matrix.
 * @param {Object} options { allFlagsMap, segmentsMap }
 * @returns {Object} Comprehensive differential impact analysis.
 */
function simulateBatchImpact(proposedFlag, testContexts = null, options = {}) {
  const { allFlagsMap = {}, segmentsMap = {} } = options;
  const contexts = (Array.isArray(testContexts) && testContexts.length > 0)
    ? testContexts
    : generateSyntheticContexts();

  const targetKey = proposedFlag.key;

  // Build baseline and hypothetical catalogs
  const baselineCatalog = { ...allFlagsMap };
  const hypotheticalCatalog = { ...allFlagsMap, [targetKey]: proposedFlag };

  let contextsChangedCount = 0;
  const directVariantTransitions = {};
  const downstreamImpactsMap = {}; // dependentKey -> { flagKey, count, reasons, brokenContexts: [] }
  let prerequisiteFailuresCount = 0;

  for (const ctx of contexts) {
    let contextExperiencedChange = false;

    // 1. Evaluate target flag in baseline vs. hypothetical
    const baselineEval = baselineCatalog[targetKey]
      ? evaluateFlag(baselineCatalog[targetKey], ctx, { allFlagsMap: baselineCatalog, segmentsMap })
      : null;

    const hypotheticalEval = evaluateFlag(proposedFlag, ctx, {
      allFlagsMap: hypotheticalCatalog,
      segmentsMap
    });

    const isDirectChange = !baselineEval ||
      baselineEval.variant !== hypotheticalEval.variant ||
      baselineEval.reason !== hypotheticalEval.reason;

    if (isDirectChange) {
      contextExperiencedChange = true;
      const transitionKey = `${baselineEval ? baselineEval.variant : 'NONE'} ➔ ${hypotheticalEval.variant}`;
      directVariantTransitions[transitionKey] = (directVariantTransitions[transitionKey] || 0) + 1;
    }

    // 2. Evaluate all other flags to detect downstream ripples / prerequisite failures
    for (const [flagKey, flagObj] of Object.entries(hypotheticalCatalog)) {
      if (flagKey === targetKey || !flagObj) continue;

      const baseDepEval = baselineCatalog[flagKey]
        ? evaluateFlag(baselineCatalog[flagKey], ctx, { allFlagsMap: baselineCatalog, segmentsMap })
        : null;

      const hypoDepEval = evaluateFlag(flagObj, ctx, {
        allFlagsMap: hypotheticalCatalog,
        segmentsMap
      });

      const depChanged = baseDepEval && (
        baseDepEval.variant !== hypoDepEval.variant ||
        baseDepEval.reason !== hypoDepEval.reason
      );

      if (depChanged) {
        contextExperiencedChange = true;
        if (!downstreamImpactsMap[flagKey]) {
          downstreamImpactsMap[flagKey] = {
            flagKey,
            impactedContexts: 0,
            prerequisiteFailures: 0,
            sampleTransitions: []
          };
        }

        downstreamImpactsMap[flagKey].impactedContexts++;

        if (hypoDepEval.reason === 'PREREQUISITE_FAILED') {
          downstreamImpactsMap[flagKey].prerequisiteFailures++;
          prerequisiteFailuresCount++;
        }

        if (downstreamImpactsMap[flagKey].sampleTransitions.length < 3) {
          downstreamImpactsMap[flagKey].sampleTransitions.push({
            context: ctx.targetingKey,
            country: ctx.country,
            from: `${baseDepEval.variant} (${baseDepEval.reason})`,
            to: `${hypoDepEval.variant} (${hypoDepEval.reason})`
          });
        }
      }
    }

    if (contextExperiencedChange) {
      contextsChangedCount++;
    }
  }

  const totalContexts = contexts.length;
  const blastRadiusPercentage = totalContexts > 0
    ? parseFloat(((contextsChangedCount / totalContexts) * 100).toFixed(1))
    : 0;

  // Determine Risk Rating
  let riskRating = 'LOW';
  if (prerequisiteFailuresCount > 0 || blastRadiusPercentage >= 50) {
    riskRating = 'HIGH';
  } else if (blastRadiusPercentage >= 20 || Object.keys(downstreamImpactsMap).length > 0) {
    riskRating = 'MEDIUM';
  }

  return {
    targetFlagKey: targetKey,
    totalContextsEvaluated: totalContexts,
    contextsWithChanges: contextsChangedCount,
    blastRadiusPercentage,
    riskRating,
    directVariantTransitions,
    downstreamImpacts: Object.values(downstreamImpactsMap),
    prerequisiteFailuresCount,
    simulatedAt: new Date().toISOString()
  };
}

module.exports = {
  evaluateFlag,
  matchesCondition,
  generateSyntheticContexts,
  simulateBatchImpact
};
