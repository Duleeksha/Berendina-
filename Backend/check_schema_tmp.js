import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'berendina_db',
  password: '9966',
  port: 5432,
  ssl: false
});
try {
  const result = {};
  const tables = ['beneficiary', 'resource', 'project', 'field_visits'];
  for (const table of tables) {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `, [table]);
    result[table] = res.rows;
  }
  fs.writeFileSync('schema_output.json', JSON.stringify(result, null, 2));
} catch (err) {
  console.error(err);
} finally {
  await pool.end();
}
