import pool from '../config/db.js';
async function check() {
  try {
    const res = await pool.query("SELECT * FROM officer_details LIMIT 1");
    console.log('Columns:', Object.keys(res.rows[0] || {}));
    const schema = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'officer_details'");
    console.log('Schema:', schema.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
