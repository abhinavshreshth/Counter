// server/init.js
const pool = require('./pg');

const tableDefinitions = [
  // 1. users
  `CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     full_name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     address TEXT,
     country TEXT NOT NULL,
     state TEXT NOT NULL,
     organization TEXT,
     dob DATE
  );`,

  // 2. user_sessions
  `CREATE TABLE IF NOT EXISTS user_sessions (
     sid VARCHAR PRIMARY KEY,
     sess JSON NOT NULL,
     expire TIMESTAMP NOT NULL
  );`,

  // 3. order_logs
  `CREATE TABLE IF NOT EXISTS order_logs (
     id SERIAL PRIMARY KEY,
     order_id VARCHAR(50),
     user_id INTEGER,
     status VARCHAR(50),
     json_data JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // index on order_logs
  `CREATE INDEX IF NOT EXISTS idx_order_user ON order_logs(user_id, status);`,

  // 4. strategies
  `CREATE TABLE IF NOT EXISTS strategies (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT
  );`,

  // 5. field_definitions
  `CREATE TABLE IF NOT EXISTS field_definitions (
     id SERIAL PRIMARY KEY,
     field_key TEXT NOT NULL,
     label TEXT NOT NULL,
     type TEXT NOT NULL,
     options TEXT[],
     data_type TEXT
  );`,

  // 6. strategy_field_values
  `CREATE TABLE IF NOT EXISTS strategy_field_values (
     id SERIAL PRIMARY KEY,
     strategy_id INTEGER REFERENCES strategies(id) ON DELETE CASCADE,
     field_id INTEGER REFERENCES field_definitions(id) ON DELETE CASCADE,
     value TEXT NOT NULL,
     position INTEGER
  );`,

  // 7. login_audit
  `CREATE TABLE IF NOT EXISTS login_audit (
     id SERIAL PRIMARY KEY,
     user_id TEXT,
     ip_address TEXT,
     status TEXT,
     attempted_at TIMESTAMP WITHOUT TIME ZONE
  );`,

  // 8. user_config
  `CREATE TABLE IF NOT EXISTS user_config (
     user_id TEXT PRIMARY KEY,
     risk_limit INT,
     leverage NUMERIC
  );`,
];

async function initDatabase() {
  for (const sql of tableDefinitions) {
    try {
      await pool.query(sql);
      const nameMatch = sql.match(
        /CREATE\s+(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+([^\s(;]+)/i
      );
      const objectName = nameMatch ? nameMatch[1] : '<unknown>';
      console.log(`✅ Ensured existence of: ${objectName}`);
    } catch (err) {
      console.error('❌ Error creating table:', err.message);
      throw err;
    }
  }
}

module.exports = initDatabase;
