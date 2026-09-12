const db = require('./connection');

async function run() {
  console.log('Running database migrations...');
  try {
    await db.migrate.latest();
    console.log('Migrations completed successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  run();
}

module.exports = run;
