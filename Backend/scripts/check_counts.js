import pool from '../config/db.js';
async function check() {
  try {
    const res = await pool.query("SELECT assigned_officer_id, COUNT(*) as count FROM beneficiary GROUP BY assigned_officer_id");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
