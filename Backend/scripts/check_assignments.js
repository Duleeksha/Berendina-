import pool from '../config/db.js';
async function check() {
  try {
    const res = await pool.query(`
      SELECT b.assigned_officer_id, b.ben_project, u.first_name, u.last_name 
      FROM beneficiary b 
      JOIN user_table u ON b.assigned_officer_id = u.user_id 
      WHERE b.assigned_officer_id IS NOT NULL 
      LIMIT 10
    `);
    console.log('Sample assignments:');
    res.rows.forEach(r => {
      console.log(`Officer: ${r.first_name} ${r.last_name} (ID: ${r.assigned_officer_id}) | Project: ${r.ben_project}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
