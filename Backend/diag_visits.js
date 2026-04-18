import pool from './config/db.js';
async function diag_visits() {
  try {
    const res = await pool.query("SELECT visit_date FROM field_visits LIMIT 5;");
    console.log("Visit dates in DB:");
    res.rows.forEach(r => {
      console.log(`Raw: ${r.visit_date}, Type: ${typeof r.visit_date}, Stringified: ${JSON.stringify(r.visit_date)}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
diag_visits();
