const db = require('../db/connection');

class AnalyticsService {
  /**
   * Records a flag evaluation event with caller application, channel, and actor attribution.
   * Supports both legacy signature recordEvaluation(flagKey, variant, reason)
   * and modern telemetry signature recordEvaluation({ flagKey, variant, reason, targetingKey, callerApp, channel, businessUnit, context }).
   */
  async recordEvaluation(flagKeyOrOptions, variantArg, reasonArg) {
    try {
      let flagKey, variant, reason, targetingKey, callerApp, channel, businessUnit, context;

      if (typeof flagKeyOrOptions === 'object' && flagKeyOrOptions !== null) {
        flagKey = flagKeyOrOptions.flagKey;
        variant = String(flagKeyOrOptions.variant ?? 'default');
        reason = String(flagKeyOrOptions.reason ?? 'UNKNOWN');
        targetingKey = flagKeyOrOptions.targetingKey || 'anonymous';
        callerApp = flagKeyOrOptions.callerApp || 'unknown';
        channel = flagKeyOrOptions.channel || 'web';
        businessUnit = flagKeyOrOptions.businessUnit || null;
        context = flagKeyOrOptions.context || {};
      } else {
        flagKey = flagKeyOrOptions;
        variant = String(variantArg ?? 'default');
        reason = String(reasonArg ?? 'UNKNOWN');
        targetingKey = 'anonymous';
        callerApp = 'unknown';
        channel = 'web';
        businessUnit = null;
        context = {};
      }

      if (!flagKey) return;

      const dateBucket = new Date().toISOString().slice(0, 10);
      const nowIso = new Date().toISOString();

      // Non-blocking asynchronous ingestion to guarantee sub-millisecond evaluation latency
      setImmediate(async () => {
        try {
          // 1. Upsert daily aggregate in evaluation_metrics
          const existing = await db('evaluation_metrics')
            .where({
              flag_key: flagKey,
              variant,
              reason,
              caller_app: callerApp,
              channel,
              date_bucket: dateBucket
            })
            .first();

          if (existing) {
            await db('evaluation_metrics')
              .where({ id: existing.id })
              .update({
                count: existing.count + 1,
                last_evaluated_at: nowIso
              });
          } else {
            await db('evaluation_metrics').insert({
              flag_key: flagKey,
              variant,
              reason,
              caller_app: callerApp,
              channel,
              count: 1,
              date_bucket: dateBucket,
              last_evaluated_at: nowIso
            });
          }

          // 2. Insert granular audit log for "who evaluated what"
          // Sanitize context snapshot: omit tokens, secrets, or sensitive credentials
          const sanitizedContext = { ...context };
          delete sanitizedContext.password;
          delete sanitizedContext.token;
          delete sanitizedContext.secret;
          delete sanitizedContext.authorization;

          await db('evaluation_logs').insert({
            flag_key: flagKey,
            variant,
            reason,
            targeting_key: targetingKey,
            caller_app: callerApp,
            channel,
            business_unit: businessUnit,
            context_snapshot: JSON.stringify(sanitizedContext),
            evaluated_at: nowIso
          });

          // 3. Atomically update flag level last_evaluated_at and total_evaluations
          await db('flags')
            .where({ key: flagKey })
            .orWhere({ legacy_key: flagKey })
            .increment('total_evaluations', 1)
            .update({ last_evaluated_at: nowIso });

        } catch (err) {
          console.warn('[AnalyticsService] Background record error:', err.message);
        }
      });
    } catch (err) {
      console.warn('[AnalyticsService] Ingestion dispatch error:', err.message);
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
   * Returns comprehensive evaluation breakdown for a specific feature flag:
   * caller applications, actors (targeting keys), channel split, variant split, and recent logs.
   */
  async getFlagEvaluationDetails(flagKey) {
    // 1. Get flag metadata
    const flag = await db('flags')
      .where({ key: flagKey })
      .orWhere({ legacy_key: flagKey })
      .first();

    const canonicalKey = flag ? flag.key : flagKey;

    // 2. Aggregated metrics summary
    const metricRows = await db('evaluation_metrics')
      .where({ flag_key: canonicalKey })
      .orWhere({ flag_key: flag?.legacy_key || canonicalKey });

    let totalEvaluations = 0;
    const variantsMap = {};
    const reasonsMap = {};
    const callerAppsMap = {};
    const channelsMap = {};
    let latestEvaluatedAt = flag?.last_evaluated_at || null;

    for (const row of metricRows) {
      const count = Number(row.count || 0);
      totalEvaluations += count;
      variantsMap[row.variant] = (variantsMap[row.variant] || 0) + count;
      reasonsMap[row.reason] = (reasonsMap[row.reason] || 0) + count;
      
      const app = row.caller_app || 'unknown';
      callerAppsMap[app] = (callerAppsMap[app] || 0) + count;

      const ch = row.channel || 'web';
      channelsMap[ch] = (channelsMap[ch] || 0) + count;

      if (row.last_evaluated_at && (!latestEvaluatedAt || row.last_evaluated_at > latestEvaluatedAt)) {
        latestEvaluatedAt = row.last_evaluated_at;
      }
    }

    // 3. Unique actors (who evaluated this flag)
    const actorRows = await db('evaluation_logs')
      .select('targeting_key')
      .count('id as eval_count')
      .max('evaluated_at as last_seen')
      .where({ flag_key: canonicalKey })
      .groupBy('targeting_key')
      .orderBy('eval_count', 'desc')
      .limit(30);

    const actors = actorRows.map(r => ({
      targetingKey: r.targeting_key || 'anonymous',
      evaluationCount: Number(r.eval_count),
      lastSeen: r.last_seen
    }));

    // 4. Recent evaluation stream (last 50 logs)
    const recentLogs = await db('evaluation_logs')
      .where({ flag_key: canonicalKey })
      .orderBy('evaluated_at', 'desc')
      .limit(50);

    const parsedLogs = recentLogs.map(l => ({
      id: l.id,
      variant: l.variant,
      reason: l.reason,
      targetingKey: l.targeting_key,
      callerApp: l.caller_app,
      channel: l.channel,
      businessUnit: l.business_unit,
      evaluatedAt: l.evaluated_at
    }));

    return {
      flagKey: canonicalKey,
      totalEvaluations: Math.max(totalEvaluations, flag?.total_evaluations || 0),
      lastEvaluatedAt: latestEvaluatedAt,
      variants: Object.entries(variantsMap).map(([variant, count]) => ({
        variant,
        count,
        percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0
      })),
      reasons: reasonsMap,
      callerApps: Object.entries(callerAppsMap).map(([app, count]) => ({
        app,
        count,
        percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0
      })),
      channels: Object.entries(channelsMap).map(([channel, count]) => ({
        channel,
        count,
        percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0
      })),
      actors,
      recentLogs: parsedLogs
    };
  }

  /**
   * Returns enterprise-wide evaluation summary with breakdown by app, channel, and flags.
   */
  async getEvaluationSummary() {
    const rows = await db('evaluation_metrics')
      .select('flag_key', 'variant', 'reason', 'caller_app', 'channel')
      .sum('count as total_count')
      .max('last_evaluated_at as latest_eval')
      .groupBy('flag_key', 'variant', 'reason', 'caller_app', 'channel');

    const flagMetrics = {};
    const appBreakdown = {};
    const channelBreakdown = {};
    let totalAllEvaluations = 0;

    for (const row of rows) {
      const total = Number(row.total_count);
      totalAllEvaluations += total;

      // Group by flagKey
      if (!flagMetrics[row.flag_key]) {
        flagMetrics[row.flag_key] = {
          flagKey: row.flag_key,
          totalEvaluations: 0,
          variants: {},
          reasons: {},
          callerApps: {},
          channels: {},
          lastEvaluatedAt: null
        };
      }

      const fm = flagMetrics[row.flag_key];
      fm.totalEvaluations += total;
      fm.variants[row.variant] = (fm.variants[row.variant] || 0) + total;
      fm.reasons[row.reason] = (fm.reasons[row.reason] || 0) + total;

      const app = row.caller_app || 'unknown';
      fm.callerApps[app] = (fm.callerApps[app] || 0) + total;
      appBreakdown[app] = (appBreakdown[app] || 0) + total;

      const ch = row.channel || 'web';
      fm.channels[ch] = (fm.channels[ch] || 0) + total;
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + total;

      if (row.latest_eval && (!fm.lastEvaluatedAt || row.latest_eval > fm.lastEvaluatedAt)) {
        fm.lastEvaluatedAt = row.latest_eval;
      }
    }

    const trackingEvents = await db('tracking_events')
      .select('event_name')
      .count('id as count')
      .groupBy('event_name');

    // Total unique actors active across the enterprise
    const uniqueActorsCount = await db('evaluation_logs')
      .countDistinct('targeting_key as count')
      .first();

    return {
      totalEvaluations: totalAllEvaluations,
      uniqueActorsCount: Number(uniqueActorsCount?.count || 0),
      appBreakdown: Object.entries(appBreakdown).map(([app, count]) => ({
        app,
        count,
        percentage: totalAllEvaluations > 0 ? Math.round((count / totalAllEvaluations) * 100) : 0
      })),
      channelBreakdown: Object.entries(channelBreakdown).map(([channel, count]) => ({
        channel,
        count,
        percentage: totalAllEvaluations > 0 ? Math.round((count / totalAllEvaluations) * 100) : 0
      })),
      flagMetrics: Object.values(flagMetrics),
      trackingEvents: trackingEvents.map(t => ({ event: t.event_name, count: Number(t.count) }))
    };
  }

  /**
   * Detects Dead Flags, Inactive Flags, and Technical Debt Hygiene Issues.
   * Categorizes flags needing cleanup:
   * 1. DEAD_ZERO_EVALUATIONS: Never evaluated anywhere.
   * 2. DEAD_INACTIVE_30D: Inactive for 30+ days.
   * 3. DEAD_APP_PATH: Tagged for an app, but that app never queries it.
   * 4. SINGLE_VARIANT_SATURATION: 100% evaluated to same single variant.
   * 5. DISABLED_DORMANT_14D: Disabled for 14+ days.
   * 6. INACTIVE_RULES_30D: Enabled for 30+ days without rule changes.
   */
  async getFlagHygieneReport(flags) {
    const summary = await this.getEvaluationSummary();
    const metricsMap = new Map(summary.flagMetrics.map(m => [m.flagKey, m]));

    const now = Date.now();
    const staleDays30 = 30 * 24 * 60 * 60 * 1000;
    const dormantDays14 = 14 * 24 * 60 * 60 * 1000;

    const hygieneIssues = [];

    for (const flag of flags) {
      // Ignore already archived flags
      if (flag.lifecycle_state === 'ARCHIVED') continue;

      const createdAt = new Date(flag.created_at || Date.now()).getTime();
      const updatedAt = new Date(flag.updated_at || flag.created_at || Date.now()).getTime();
      const daysSinceCreation = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
      const daysSinceUpdate = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));

      const metrics = metricsMap.get(flag.key) || metricsMap.get(flag.legacy_key);
      const totalEvaluations = metrics ? metrics.totalEvaluations : (flag.total_evaluations || 0);
      const lastEvaluatedAt = metrics?.lastEvaluatedAt || flag.last_evaluated_at;

      const daysSinceLastEvaluation = lastEvaluatedAt
        ? Math.floor((now - new Date(lastEvaluatedAt).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      // 1. Check: ZERO EVALUATIONS (Dead Flag)
      if (totalEvaluations === 0 && (daysSinceCreation >= 1 || flag.state === 'DISABLED' || flag.lifecycle_state === 'DISABLED')) {
        hygieneIssues.push({
          flagKey: flag.key,
          businessUnit: flag.business_unit_id,
          severity: 'HIGH',
          type: 'DEAD_ZERO_EVALUATIONS',
          title: 'Zero Production Evaluations',
          message: `Flag has 0 recorded evaluations across all applications since creation (${daysSinceCreation} days ago). Code references may be non-existent or dead.`,
          totalEvaluations: 0,
          daysSinceLastEvaluation: null,
          recommendedAction: 'ARCHIVE',
          actionLabel: 'Archive Dead Flag'
        });
      }
      // 2. Check: INACTIVE FOR 30+ DAYS (Dormant Flag)
      else if (daysSinceLastEvaluation !== null && daysSinceLastEvaluation >= 30) {
        hygieneIssues.push({
          flagKey: flag.key,
          businessUnit: flag.business_unit_id,
          severity: 'HIGH',
          type: 'DEAD_INACTIVE_30D',
          title: 'Dormant (30+ Days Inactive)',
          message: `Flag has not received any evaluation traffic in ${daysSinceLastEvaluation} days. Feature may be decommissioned in client applications.`,
          totalEvaluations,
          daysSinceLastEvaluation,
          recommendedAction: 'ARCHIVE',
          actionLabel: 'Archive Inactive Flag'
        });
      }

      // 3. Check: DEAD APP PATH (Tagged for app, but app never evaluates it)
      let appTags = [];
      try {
        appTags = typeof flag.app_tags === 'string' ? JSON.parse(flag.app_tags) : (flag.app_tags || []);
      } catch (e) {
        appTags = [];
      }

      if (metrics && appTags.length > 1) {
        const evaluatingApps = Object.keys(metrics.callerApps);
        const deadApps = appTags.filter(tag => !evaluatingApps.includes(tag) && !evaluatingApps.includes(`app-${tag}`));

        if (deadApps.length > 0 && totalEvaluations > 20) {
          hygieneIssues.push({
            flagKey: flag.key,
            businessUnit: flag.business_unit_id,
            severity: 'MEDIUM',
            type: 'DEAD_APP_PATH',
            title: 'Dead App Code Path',
            message: `Flag is tagged for applications [${appTags.join(', ')}], but has 0 evaluations from [${deadApps.join(', ')}]. Code references in ${deadApps.join(', ')} may be dead.`,
            totalEvaluations,
            deadApps,
            evaluatingApps,
            recommendedAction: 'INSPECT_CODE',
            actionLabel: 'Inspect Dead App Code'
          });
        }
      }

      // 4. Check: 100% SINGLE VARIANT SATURATION (Ready for Graduation)
      if (metrics && metrics.totalEvaluations >= 50 && flag.lifecycle_state !== 'GRADUATED') {
        const variantCounts = Object.values(metrics.variants);
        const maxVariantCount = Math.max(...variantCounts);
        const percentage = (maxVariantCount / metrics.totalEvaluations) * 100;

        if (percentage >= 99.0) {
          const dominantVariant = Object.keys(metrics.variants).find(k => metrics.variants[k] === maxVariantCount);
          hygieneIssues.push({
            flagKey: flag.key,
            businessUnit: flag.business_unit_id,
            severity: 'LOW',
            type: 'SINGLE_VARIANT_SATURATION',
            title: 'Single Variant Saturation (100%)',
            message: `100% of evaluations resolve to variant "${dominantVariant}" across ${metrics.totalEvaluations} requests. Feature is permanent and ready to graduate from code.`,
            dominantVariant,
            totalEvaluations: metrics.totalEvaluations,
            recommendedAction: 'GRADUATE',
            actionLabel: `Graduate to "${dominantVariant}"`
          });
        }
      }

      // 5. Check: DISABLED for 14+ days (Safe for Deletion)
      if ((flag.state === 'DISABLED' || flag.lifecycle_state === 'DISABLED') && daysSinceUpdate >= 14) {
        hygieneIssues.push({
          flagKey: flag.key,
          businessUnit: flag.business_unit_id,
          severity: 'MEDIUM',
          type: 'DISABLED_14D',
          title: 'Disabled for 14+ Days',
          message: `Flag has been DISABLED for ${daysSinceUpdate} days. Candidate for permanent code removal and deletion.`,
          daysSinceUpdate,
          totalEvaluations,
          recommendedAction: 'DELETE',
          actionLabel: 'Delete Flag'
        });
      }

      // 6. Check: ENABLED with no rule changes for 30+ days
      if (flag.state === 'ENABLED' && flag.lifecycle_state === 'ENABLED' && daysSinceUpdate >= 30) {
        hygieneIssues.push({
          flagKey: flag.key,
          businessUnit: flag.business_unit_id,
          severity: 'LOW',
          type: 'INACTIVE_RULES_30D',
          title: 'Unmodified Enabled Rules (30d+)',
          message: `Flag has been ENABLED with no rule updates for ${daysSinceUpdate} days. Consider reviewing or graduating.`,
          daysSinceUpdate,
          totalEvaluations,
          recommendedAction: 'GRADUATE',
          actionLabel: 'Review / Graduate'
        });
      }
    }

    return hygieneIssues;
  }

  /**
   * Generates an engineering sprint ticket in Markdown format
   * listing all dead and stale flags for code cleanup.
   */
  async generateCleanupSprintTicket(flags) {
    const issues = await this.getFlagHygieneReport(flags);
    const dateStr = new Date().toISOString().slice(0, 10);

    let md = `# 🧹 Technical Debt & Flag Cleanup Sprint Ticket (${dateStr})\n\n`;
    md += `**Total Flags Audited**: ${flags.length}\n`;
    md += `**Cleanup Candidates Identified**: ${issues.length}\n\n`;

    const deadZero = issues.filter(i => i.type === 'DEAD_ZERO_EVALUATIONS');
    const dormant = issues.filter(i => i.type === 'DEAD_INACTIVE_30D');
    const deadPaths = issues.filter(i => i.type === 'DEAD_APP_PATH');
    const saturated = issues.filter(i => i.type === 'SINGLE_VARIANT_SATURATION');
    const disabled = issues.filter(i => i.type === 'DISABLED_14D');

    if (deadZero.length > 0) {
      md += `## ❌ 1. Dead Flags (Zero Production Evaluations)\n`;
      md += `These flags have never received evaluation traffic. Check if code references were never deployed or if feature is dead:\n\n`;
      deadZero.forEach(item => {
        md += `- [ ] \`${item.flagKey}\` — ${item.message}\n`;
      });
      md += `\n`;
    }

    if (dormant.length > 0) {
      md += `## ⏳ 2. Dormant Flags (Inactive 30+ Days)\n`;
      md += `No traffic observed in 30+ days:\n\n`;
      dormant.forEach(item => {
        md += `- [ ] \`${item.flagKey}\` — Last evaluated ${item.daysSinceLastEvaluation} days ago (${item.totalEvaluations} total evals)\n`;
      });
      md += `\n`;
    }

    if (deadPaths.length > 0) {
      md += `## 🔀 3. Dead Microservice App Paths\n`;
      md += `These flags are tagged for multiple applications, but one or more microservices never query them:\n\n`;
      deadPaths.forEach(item => {
        md += `- [ ] \`${item.flagKey}\` — Dead in: \`[${item.deadApps.join(', ')}]\` | Active in: \`[${item.evaluatingApps.join(', ')}]\`\n`;
      });
      md += `\n`;
    }

    if (saturated.length > 0) {
      md += `## 🎓 4. Permanent Features Ready for Graduation\n`;
      md += `These features have 100% rollout stability and should be hardcoded to eliminate SDK evaluation overhead:\n\n`;
      saturated.forEach(item => {
        md += `- [ ] \`${item.flagKey}\` — Hardcode variant: \`"${item.dominantVariant}"\` (${item.totalEvaluations} evals)\n`;
      });
      md += `\n`;
    }

    if (disabled.length > 0) {
      md += `## 🗑️ 5. Decommissioned Disabled Flags\n`;
      md += `Disabled for 14+ days. Remove conditional blocks from source code and delete flags:\n\n`;
      disabled.forEach(item => {
        md += `- [ ] \`${item.flagKey}\` — Disabled for ${item.daysSinceUpdate} days\n`;
      });
      md += `\n`;
    }

    md += `---\n*Generated automatically by Apex FlagOps Telemetry & Governance Engine*\n`;
    return md;
  }
}

module.exports = new AnalyticsService();
