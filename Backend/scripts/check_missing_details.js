import pool from '../config/db.js';
async function check() {
  try {
    const res = await pool.query(`
      SELECT u.user_id, u.first_name, u.last_name 
      FROM user_table u 
      LEFT JOIN officer_details o ON u.user_id = o.user_id 
      WHERE u.role = 'officer' AND o.user_id IS NULL
    `);
    console.log('Officers missing officer_details:', res.rows.length);
    res.rows.forEach(r => console.log(`- ${r.user_id}: ${r.first_name} ${r.last_name}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
