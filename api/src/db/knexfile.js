const path = require('path');
require('dotenv').config();

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/flags.sqlite');

const config = {
  client: process.env.DB_CLIENT === 'pg' ? 'pg' : 'better-sqlite3',
  connection: process.env.DB_CLIENT === 'pg' 
    ? (process.env.DATABASE_URL || {
        host: process.env.PG_HOST || '127.0.0.1',
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
        database: process.env.PG_DATABASE || 'openfeature_db'
      })
    : {
        filename: dbPath
      },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations')
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds')
  }
};

module.exports = config;
