const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});
pool.query('SELECT NOW()')
  .then(res => console.log('✅ DB Connected:', res.rows[0]))
  .catch(err => console.error('❌ DB connection failed:', err.message));

async function checkSchemaAndData() {
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `);

    for (const row of tables.rows) {
      const tableName = row.table_name;
      console.log(`\n📄 Table: ${tableName}`);

      // Show table columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      for (const col of columns.rows) {
        console.log(`   - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      }

      // Show first 3 rows of data
      const sampleRows = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
      if (sampleRows.rows.length) {
        console.log(`\n   📊 Sample Data:`);
        sampleRows.rows.forEach((record, index) => {
          console.log(`   Row ${index + 1}:`, record);
        });
      } else {
        console.log(`\n   📭 No data found in this table.`);
      }
    }

    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkSchemaAndData();