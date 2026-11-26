const config = require('./src/config/env');
const { createDatabase } = require('./src/db/database');
const { createApp } = require('./src/app');

const db = createDatabase(config.dbPath);
const app = createApp(db);

const server = app.listen(config.port, config.host, () => {
  console.log(`S.G. Associates Portal running at http://${config.host}:${config.port}`);
  console.log(`Admin login: http://${config.host}:${config.port}/admin-login.html`);
});

process.on('SIGINT', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
