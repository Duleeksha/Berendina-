import pool from './config/db.js';
import fs from 'fs';
async function getTables() {
  const tables = ['resource', 'project', 'beneficiary', 'field_visits'];
  let results = {};
  for (const table of tables) {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    results[table] = res.rows;
  }
  fs.writeFileSync('schema_debug.json', JSON.stringify(results, null, 2));
  console.log('Schema debug info written to schema_debug.json');
  process.exit(0);
}
getTables().catch(err => {
  console.error(err);
  process.exit(1);
});
