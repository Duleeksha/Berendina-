import pool from './config/db.js';
async function diag_visits_final() {
  try {
    const res = await pool.query("SELECT visit_date::TEXT AS date FROM field_visits;");
    console.log("Visit dates as TEXT from DB:");
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
diag_visits_final();
