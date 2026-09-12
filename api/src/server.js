const app = require('./app');
const db = require('./db/connection');
const runMigrations = require('./db/runMigrations');
const runSeeds = require('./db/runSeeds');
const schedulerService = require('./services/schedulerService');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Run database migrations on startup
    await runMigrations();

    // Check if flags table is empty, if so seed it
    const flagCount = await db('flags').count('id as count').first();
    if (flagCount && flagCount.count === 0) {
      console.log('Database empty, seeding default OpenFeature flags...');
      await runSeeds();
    }

    // Start background scheduled change processor
    schedulerService.start();

    const server = app.listen(PORT, () => {
      console.log(`🚀 OpenFeature Core API listening on http://localhost:${PORT}`);
      console.log(`📡 OFREP endpoint: http://localhost:${PORT}/ofrep/v1/evaluate/flags`);
      console.log(`⚡ SSE event stream: http://localhost:${PORT}/api/v1/events/flags`);
      console.log(`⚙️ Admin REST API: http://localhost:${PORT}/api/v1/admin/flags`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start OpenFeature Core API:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start, app };
