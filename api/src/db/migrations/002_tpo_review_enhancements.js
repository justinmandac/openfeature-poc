/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Enhance flags table with lifecycle_state and prerequisites
  const hasLifecycle = await knex.schema.hasColumn('flags', 'lifecycle_state');
  if (!hasLifecycle) {
    await knex.schema.table('flags', (table) => {
      table.string('lifecycle_state').notNullable().defaultTo('ENABLED'); // DRAFT, ENABLED, DISABLED, GRADUATED, ARCHIVED
      table.text('prerequisites').notNullable().defaultTo('[]'); // JSON array: [{ flagKey, variant }]
      table.string('graduated_variant').nullable();
    });
  }

  // 2. Create Reusable User Segments table
  await knex.schema.createTable('segments', (table) => {
    table.string('id').primary(); // e.g. "segment-apac-premium", "segment-beta-testers"
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.text('condition').notNullable(); // JSON condition object e.g. { country: ["SG", "MY", "PH"], userTier: "PREMIUM" }
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Create Scheduled Flag Changes table
  await knex.schema.createTable('scheduled_changes', (table) => {
    table.increments('id').primary();
    table.string('flag_key').notNullable().index();
    table.timestamp('scheduled_at').notNullable();
    table.text('changes').notNullable(); // JSON object of flag updates
    table.string('status').notNullable().defaultTo('PENDING'); // PENDING, APPLIED, CANCELLED
    table.timestamp('applied_at').nullable();
    table.string('author').notNullable();
    table.text('reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 4. Create Evaluation Analytics & Tracking Events table
  await knex.schema.createTable('evaluation_metrics', (table) => {
    table.increments('id').primary();
    table.string('flag_key').notNullable().index();
    table.string('variant').notNullable();
    table.string('reason').notNullable();
    table.integer('count').notNullable().defaultTo(1);
    table.string('date_bucket').notNullable().index(); // YYYY-MM-DD
  });

  await knex.schema.createTable('tracking_events', (table) => {
    table.increments('id').primary();
    table.string('event_name').notNullable().index();
    table.string('targeting_key').nullable();
    table.text('context').nullable(); // JSON context
    table.text('details').nullable(); // JSON tracking payload
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('tracking_events');
  await knex.schema.dropTableIfExists('evaluation_metrics');
  await knex.schema.dropTableIfExists('scheduled_changes');
  await knex.schema.dropTableIfExists('segments');
  await knex.schema.table('flags', (table) => {
    table.dropColumn('graduated_variant');
    table.dropColumn('prerequisites');
    table.dropColumn('lifecycle_state');
  });
};
