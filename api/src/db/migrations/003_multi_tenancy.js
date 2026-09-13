/**
 * Migration 003: Multi-Tenancy Architecture
 * Adds business_units and applications tables, and associates flags and segments to tenants.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create business_units table
  const hasBusinessUnits = await knex.schema.hasTable('business_units');
  if (!hasBusinessUnits) {
    await knex.schema.createTable('business_units', (table) => {
      table.string('id').primary(); // e.g. 'bu-retail', 'bu-wealth', 'bu-cards', 'bu-platform'
      table.string('code').unique().notNullable(); // e.g. 'retail', 'wealth', 'cards', 'platform'
      table.string('name').notNullable(); // 'Retail Banking', 'Wealth & Asset Management'
      table.string('lead_email').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Create applications table
  const hasApplications = await knex.schema.hasTable('applications');
  if (!hasApplications) {
    await knex.schema.createTable('applications', (table) => {
      table.string('id').primary(); // e.g. 'app-retail-copilot', 'app-wealth-advisory'
      table.string('business_unit_id').notNullable();
      table.string('code').notNullable(); // e.g. 'copilot', 'advisory', 'accounts'
      table.string('name').notNullable();
      table.text('allowed_channels').notNullable().defaultTo('["web"]'); // JSON array: ["web", "mobile", "partner"]
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 3. Enhance flags table with tenancy fields
  const hasBuColumn = await knex.schema.hasColumn('flags', 'business_unit_id');
  if (!hasBuColumn) {
    await knex.schema.table('flags', (table) => {
      table.string('business_unit_id').nullable();
      table.string('app_id').nullable();
      table.text('shared_channels').notNullable().defaultTo('["web"]'); // JSON array of channels
      table.boolean('is_global').notNullable().defaultTo(false);
      table.string('legacy_key').nullable(); // Backward compatibility alias
    });
  }

  // 4. Enhance segments table with optional business_unit_id (NULL = Enterprise Global Segment)
  const hasSegmentBu = await knex.schema.hasColumn('segments', 'business_unit_id');
  if (!hasSegmentBu) {
    await knex.schema.table('segments', (table) => {
      table.string('business_unit_id').nullable();
    });
  }

  // 5. Enhance flag_history table with business_unit_id
  const hasHistoryBu = await knex.schema.hasColumn('flag_history', 'business_unit_id');
  if (!hasHistoryBu) {
    await knex.schema.table('flag_history', (table) => {
      table.string('business_unit_id').nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasHistoryBu = await knex.schema.hasColumn('flag_history', 'business_unit_id');
  if (hasHistoryBu) {
    await knex.schema.table('flag_history', (table) => {
      table.dropColumn('business_unit_id');
    });
  }

  const hasSegmentBu = await knex.schema.hasColumn('segments', 'business_unit_id');
  if (hasSegmentBu) {
    await knex.schema.table('segments', (table) => {
      table.dropColumn('business_unit_id');
    });
  }

  const hasBuColumn = await knex.schema.hasColumn('flags', 'business_unit_id');
  if (hasBuColumn) {
    await knex.schema.table('flags', (table) => {
      table.dropColumn('legacy_key');
      table.dropColumn('is_global');
      table.dropColumn('shared_channels');
      table.dropColumn('app_id');
      table.dropColumn('business_unit_id');
    });
  }

  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('business_units');
};
