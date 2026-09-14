/**
 * Migration 004: Evaluation Telemetry & Dead Flag Hygiene
 * Enhances flags and metrics with caller application, channel, and actor attribution,
 * and creates granular evaluation_logs table.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Enhance flags table with evaluation tracking columns
  const hasLastEvaluated = await knex.schema.hasColumn('flags', 'last_evaluated_at');
  if (!hasLastEvaluated) {
    await knex.schema.table('flags', (table) => {
      table.timestamp('last_evaluated_at').nullable().index();
      table.integer('total_evaluations').notNullable().defaultTo(0);
    });
  }

  // 2. Enhance evaluation_metrics table with caller_app, channel, and last_evaluated_at
  const hasCallerApp = await knex.schema.hasColumn('evaluation_metrics', 'caller_app');
  if (!hasCallerApp) {
    await knex.schema.table('evaluation_metrics', (table) => {
      table.string('caller_app').nullable().index();
      table.string('channel').nullable().index();
      table.timestamp('last_evaluated_at').nullable();
    });
  }

  // 3. Create evaluation_logs table for granular actor attribution ("who evaluated what")
  const hasEvaluationLogs = await knex.schema.hasTable('evaluation_logs');
  if (!hasEvaluationLogs) {
    await knex.schema.createTable('evaluation_logs', (table) => {
      table.increments('id').primary();
      table.string('flag_key').notNullable().index();
      table.string('variant').notNullable();
      table.string('reason').notNullable();
      table.string('targeting_key').nullable().index(); // Actor / user identity
      table.string('caller_app').nullable().index();    // e.g. webapp, webapp-bff, android-app
      table.string('channel').nullable().index();       // e.g. web, mobile, partner
      table.string('business_unit').nullable().index(); // e.g. retail, wealth, cards, platform
      table.text('context_snapshot').nullable();        // JSON snapshot of sanitized context
      table.timestamp('evaluated_at').defaultTo(knex.fn.now()).index();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('evaluation_logs');

  const hasCallerApp = await knex.schema.hasColumn('evaluation_metrics', 'caller_app');
  if (hasCallerApp) {
    await knex.schema.table('evaluation_metrics', (table) => {
      table.dropColumn('caller_app');
      table.dropColumn('channel');
      table.dropColumn('last_evaluated_at');
    });
  }

  const hasLastEvaluated = await knex.schema.hasColumn('flags', 'last_evaluated_at');
  if (hasLastEvaluated) {
    await knex.schema.table('flags', (table) => {
      table.dropColumn('last_evaluated_at');
      table.dropColumn('total_evaluations');
    });
  }
};
