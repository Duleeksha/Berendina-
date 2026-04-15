import pool from '../config/db.js';

async function debug() {
  try {
    const res = await pool.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.status,
             (SELECT COUNT(*) FROM beneficiary b WHERE b.assigned_officer_id = u.user_id) as beneficiary_count
      FROM user_table u
      WHERE u.role = 'officer'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}

debug();
