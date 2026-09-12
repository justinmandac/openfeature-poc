const db = require('./connection');

async function run() {
  console.log('Running database seeds...');
  try {
    await db.seed.run();
    console.log('Seeds executed successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding failed:', error);
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
