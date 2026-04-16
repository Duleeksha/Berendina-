import pool from '../config/db.js';

async function performDeletion() {
  try {
    const res = await pool.query("DELETE FROM field_visits WHERE status = 'scheduled' RETURNING *");
    console.log(`Successfully deleted ${res.rowCount} scheduled visits.`);
    res.rows.forEach(row => {
      console.log(`- Deleted Visit ID: ${row.visit_id}, Beneficiary: ${row.beneficiary_name}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  }
}

performDeletion();
