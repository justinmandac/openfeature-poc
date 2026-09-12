const db = require('../db/connection');
const flagEvents = require('./eventEmitter');

class SchedulerService {
  constructor() {
    this.timer = null;
    this.flagService = null;
  }

  setFlagService(service) {
    this.flagService = service;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.processPendingChanges(), 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async scheduleChange({ flag_key, scheduled_at, changes, author = 'scheduler-admin', reason }) {
    const record = {
      flag_key,
      scheduled_at: new Date(scheduled_at).toISOString(),
      changes: typeof changes === 'string' ? changes : JSON.stringify(changes),
      status: 'PENDING',
      author,
      reason: reason || 'Scheduled automated flag mutation',
      created_at: new Date().toISOString()
    };

    const [id] = await db('scheduled_changes').insert(record);
    return { id, ...record };
  }

  async getScheduledChanges(flagKey) {
    let query = db('scheduled_changes').select('*').orderBy('scheduled_at', 'asc');
    if (flagKey) {
      query = query.where({ flag_key: flagKey });
    }
    const rows = await query;
    return rows.map(r => ({
      ...r,
      changes: typeof r.changes === 'string' ? JSON.parse(r.changes) : r.changes
    }));
  }

  async cancelScheduledChange(id) {
    await db('scheduled_changes')
      .where({ id, status: 'PENDING' })
      .update({ status: 'CANCELLED' });
    return { success: true, id };
  }

  async processPendingChanges() {
    try {
      if (!this.flagService) return;

      const now = new Date().toISOString();
      const dueChanges = await db('scheduled_changes')
        .where('status', 'PENDING')
        .where('scheduled_at', '<=', now);

      for (const item of dueChanges) {
        try {
          const changes = typeof item.changes === 'string' ? JSON.parse(item.changes) : item.changes;
          await this.flagService.updateFlag(
            item.flag_key,
            changes,
            item.author || 'scheduled-executor',
            `[Scheduled Auto-Release] ${item.reason || 'Executed on schedule'}`
          );

          await db('scheduled_changes')
            .where({ id: item.id })
            .update({
              status: 'APPLIED',
              applied_at: new Date().toISOString()
            });

          console.log(`⏱️ Applied scheduled change #${item.id} for flag "${item.flag_key}"`);
        } catch (execErr) {
          console.error(`Failed to execute scheduled change #${item.id}:`, execErr);
          await db('scheduled_changes')
            .where({ id: item.id })
            .update({ status: 'FAILED' });
        }
      }
    } catch (err) {
      console.warn('Error processing scheduled changes:', err.message);
    }
  }
}

const schedulerService = new SchedulerService();

module.exports = schedulerService;
