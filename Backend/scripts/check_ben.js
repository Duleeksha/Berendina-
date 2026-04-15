import pool from '../config/db.js';

async function check() {
  try {
    const res = await pool.query("SELECT * FROM beneficiary LIMIT 1");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
