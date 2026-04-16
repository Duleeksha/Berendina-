import pool from '../config/db.js';

async function check() {
  try {
    const res = await pool.query("SELECT visit_id, beneficiary_name, status FROM field_visits WHERE status = 'scheduled'");
    console.log(`Found ${res.rows.length} scheduled visits.`);
    res.rows.forEach(row => {
      console.log(`- ID: ${row.visit_id}, Beneficiary: ${row.beneficiary_name}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
