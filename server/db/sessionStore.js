const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const pool = require('./pg');

module.exports = new PgStore({
  pool,                   // your pg.Pool instance
  tableName: 'user_sessions',
  createTableIfMissing: true
});
