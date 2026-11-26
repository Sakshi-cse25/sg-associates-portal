const path = require('node:path');

/**
 * Central application configuration loaded from environment variables
 * with safe defaults for local development and examination demos.
 */
const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET || 'sg-associates-dev-session-secret-key',
  sessionTtlMs: (Number(process.env.SESSION_TTL_MINUTES) || 30) * 60 * 1000,
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'sg_associates.db'),
  defaultAdminUser: process.env.ADMIN_DEFAULT_USER || 'admin',
  defaultAdminPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123',
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
