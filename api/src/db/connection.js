const knex = require('knex');
const config = require('./knexfile');
const fs = require('fs');
const path = require('path');

// Ensure SQLite directory exists if using sqlite
if (config.client === 'better-sqlite3' && config.connection.filename) {
  const dir = path.dirname(config.connection.filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = knex(config);

module.exports = db;
