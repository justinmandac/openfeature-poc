const db = require('./connection');

async function repairUnknownCallerApps() {
  console.log('Starting repair of unknown caller applications in database...');

  // 1. Repair evaluation_logs
  const logMobileUpdated = await db('evaluation_logs')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .andWhere(function() {
      this.where('channel', 'mobile').orWhere('context_snapshot', 'like', '%"platform":"android"%');
    })
    .update({ caller_app: 'android-app', channel: 'mobile' });

  const logBffUpdated = await db('evaluation_logs')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .andWhere('channel', 'backend')
    .update({ caller_app: 'webapp-bff' });

  const logWebUpdated = await db('evaluation_logs')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .update({ caller_app: 'webapp', channel: 'web' });

  console.log(`Repaired evaluation_logs: ${logMobileUpdated} mobile, ${logBffUpdated} bff, ${logWebUpdated} webapp.`);

  // 2. Repair evaluation_metrics
  const metricsMobileUpdated = await db('evaluation_metrics')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .andWhere('channel', 'mobile')
    .update({ caller_app: 'android-app' });

  const metricsBffUpdated = await db('evaluation_metrics')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .andWhere('channel', 'backend')
    .update({ caller_app: 'webapp-bff' });

  const metricsWebUpdated = await db('evaluation_metrics')
    .where(function() {
      this.where('caller_app', 'unknown').orWhereNull('caller_app');
    })
    .update({ caller_app: 'webapp', channel: 'web' });

  console.log(`Repaired evaluation_metrics: ${metricsMobileUpdated} mobile, ${metricsBffUpdated} bff, ${metricsWebUpdated} webapp.`);

  console.log('Database repair completed successfully.');
}

if (require.main === module) {
  repairUnknownCallerApps()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Repair failed:', err);
      process.exit(1);
    });
}

module.exports = repairUnknownCallerApps;
