import pool from '../config/db.js';

async function check() {
  try {
    const res = await pool.query("SELECT DISTINCT role FROM user_table");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
