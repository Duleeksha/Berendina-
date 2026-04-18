import pool from '../config/db.js';
async function research() {
  try {
    const benCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiary'");
    console.log('Beneficiary columns:', benCols.rows.map(r => r.column_name));
    const userCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_table'");
    console.log('User columns:', userCols.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
research();
