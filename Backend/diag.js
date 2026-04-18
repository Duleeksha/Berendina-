import pool from './config/db.js';
async function diag() {
  try {
    const res = await pool.query("SELECT DISTINCT ben_project FROM beneficiary;");
    console.log("Distinct Projects in Beneficiary table:");
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
diag();
