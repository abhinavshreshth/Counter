const pool = require('./pg');

const tableDefinitions = [
  `CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS user_sessions (
     sid VARCHAR PRIMARY KEY,
     sess JSON NOT NULL,
     expire TIMESTAMP NOT NULL
   );`,
  // … add other CREATE TABLE IF NOT EXISTS here (order_logs, login_audit, user_config, etc.)
];

// ————————————————————————————
// Ensure order_logs table & index
// ————————————————————————————
tableDefinitions.push(`
    CREATE TABLE IF NOT EXISTS order_logs (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(50),
      user_id INTEGER,
      status VARCHAR(50),
      json_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

tableDefinitions.push(`
    CREATE INDEX IF NOT EXISTS idx_order_user ON order_logs(user_id, status);
  `);
  
  
async function initDatabase() {
  for (const sql of tableDefinitions) {
    try {
      await pool.query(sql);
      const nameMatch = sql.match(/CREATE\s+(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+([^\s(;]+)/i);
      const objectName = nameMatch ? nameMatch[1] : '<unknown>';
            console.log(`✅ Ensured existence of: ${objectName}`);
    } catch (err) {
      console.error('❌ Error creating table:', err.message);
      throw err;
    }
  }
}

module.exports = initDatabase;
