const db = require('../db/connection');

class AnalyticsService {
  /**
   * Increments evaluation count for a flag/variant/reason combination.
   */
  async recordEvaluation(flagKey, variant, reason) {
    try {
      const dateBucket = new Date().toISOString().slice(0, 10);
      const existing = await db('evaluation_metrics')
        .where({
          flag_key: flagKey,
          variant: String(variant),
          reason: String(reason),
          date_bucket: dateBucket
        })
        .first();

      if (existing) {
        await db('evaluation_metrics')
          .where({ id: existing.id })
          .increment('count', 1);
      } else {
        await db('evaluation_metrics').insert({
          flag_key: flagKey,
          variant: String(variant),
          reason: String(reason),
          count: 1,
          date_bucket: dateBucket
        });
      }
    } catch (err) {
      // Non-blocking telemetry error
      console.warn('Analytics record error:', err.message);
    }
  }

  /**
   * Records a business tracking event from OpenFeature client.track()
   */
  async recordTrackEvent(eventName, targetingKey, context = {}, details = {}) {
    await db('tracking_events').insert({
      event_name: eventName,
      targeting_key: targetingKey || context.targetingKey || 'anonymous',
      context: JSON.stringify(context),
      details: JSON.stringify(details),
      created_at: new Date().toISOString()
    });
  }

  /**
   * Returns evaluation summary and variant distribution across all flags.
   */
  async getEvaluationSummary() {
    const rows = await db('evaluation_metrics')
      .select('flag_key', 'variant', 'reason')
      .sum('count as total_count')
      .groupBy('flag_key', 'variant', 'reason');

    const flagMetrics = {};
    for (const row of rows) {
      if (!flagMetrics[row.flag_key]) {
        flagMetrics[row.flag_key] = {
          flagKey: row.flag_key,
          totalEvaluations: 0,
          variants: {},
          reasons: {}
        };
      }

      const total = Number(row.total_count);
      flagMetrics[row.flag_key].totalEvaluations += total;
      flagMetrics[row.flag_key].variants[row.variant] = (flagMetrics[row.flag_key].variants[row.variant] || 0) + total;
      flagMetrics[row.flag_key].reasons[row.reason] = (flagMetrics[row.flag_key].reasons[row.reason] || 0) + total;
    }

    const trackingEvents = await db('tracking_events')
      .select('event_name')
      .count('id as count')
      .groupBy('event_name');

    return {
      flagMetrics: Object.values(flagMetrics),
      trackingEvents: trackingEvents.map(t => ({ event: t.event_name, count: Number(t.count) }))
    };
  }

  /**
   * Detects Stale Flags & Hygiene Issues per TPO review requirements.
   */
  async getFlagHygieneReport(flags) {
    const summary = await this.getEvaluationSummary();
    const metricsMap = new Map(summary.flagMetrics.map(m => [m.flagKey, m]));

    const now = Date.now();
    const staleDays30 = 30 * 24 * 60 * 60 * 1000;
    const disabledDays14 = 14 * 24 * 60 * 60 * 1000;

    const hygieneIssues = [];

    for (const flag of flags) {
      const updatedAt = new Date(flag.updated_at || flag.created_at).getTime();
      const daysSinceUpdate = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));
      const metrics = metricsMap.get(flag.key);

      // 1. Check: Enabled with no rule changes in 30+ days
      if (flag.state === 'ENABLED' && flag.lifecycle_state === 'ENABLED' && (now - updatedAt) > staleDays30) {
        hygieneIssues.push({
          flagKey: flag.key,
          severity: 'MEDIUM',
          type: 'INACTIVE_RULES_30D',
          message: `Flag has been ENABLED with no rule changes for ${daysSinceUpdate} days. Consider graduating or removing.`,
          daysSinceUpdate
        });
      }

      // 2. Check: Disabled for 14+ days (candidate for archival or deletion)
      if ((flag.state === 'DISABLED' || flag.lifecycle_state === 'DISABLED') && (now - updatedAt) > disabledDays14) {
        hygieneIssues.push({
          flagKey: flag.key,
          severity: 'HIGH',
          type: 'DISABLED_14D',
          message: `Flag has been DISABLED for ${daysSinceUpdate} days. Candidate for code cleanup and deletion.`,
          daysSinceUpdate
        });
      }

      // 3. Check: 100% evaluations resolving to the same single variant (effectively hardcoded)
      if (metrics && metrics.totalEvaluations > 50) {
        const variantCounts = Object.values(metrics.variants);
        const maxVariantCount = Math.max(...variantCounts);
        const percentage = (maxVariantCount / metrics.totalEvaluations) * 100;

        if (percentage >= 99.5) {
          const dominantVariant = Object.keys(metrics.variants).find(k => metrics.variants[k] === maxVariantCount);
          hygieneIssues.push({
            flagKey: flag.key,
            severity: 'LOW',
            type: 'SINGLE_VARIANT_SATURATION',
            message: `100% of evaluations resolve to variant "${dominantVariant}" (${metrics.totalEvaluations} requests). Feature is effectively hardcoded.`,
            dominantVariant,
            evaluations: metrics.totalEvaluations
          });
        }
      }
    }

    return hygieneIssues;
  }
}

module.exports = new AnalyticsService();
