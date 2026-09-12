/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('flags', (table) => {
    table.increments('id').primary();
    table.string('key').unique().notNullable();
    table.string('type').notNullable(); // BOOLEAN, STRING, NUMBER, OBJECT
    table.string('state').notNullable().defaultTo('ENABLED'); // ENABLED, DISABLED
    table.string('default_variant').notNullable();
    table.text('variants').notNullable(); // JSON string
    table.text('rules').notNullable().defaultTo('[]'); // JSON string array of rules
    table.text('schema').nullable(); // JSON schema string
    table.text('app_tags').notNullable().defaultTo('["webapp", "bff"]'); // JSON string array
    table.text('description').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('flag_history', (table) => {
    table.increments('id').primary();
    table.string('flag_key').notNullable().index();
    table.integer('version').notNullable();
    table.text('snapshot').notNullable(); // full JSON snapshot
    table.text('diff').notNullable(); // JSON diff
    table.string('author').notNullable();
    table.text('change_reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('flag_history');
  await knex.schema.dropTableIfExists('flags');
};
