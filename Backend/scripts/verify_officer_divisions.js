import pool from '../config/db.js';
async function verify() {
  try {
    const res = await pool.query('SELECT user_id, ds_division FROM officer_details');
    console.log(`Total officers checked: ${res.rows.length}`);
    const unassigned = res.rows.filter(r => !r.ds_division);
    if (unassigned.length > 0) {
      console.error(`FATAL: ${unassigned.length} officers still have no DS Division.`);
    } else {
      console.log('SUCCESS: All officers have a DS Division assigned.');
    }
    const distribution = res.rows.reduce((acc, r) => {
      acc[r.ds_division] = (acc[r.ds_division] || 0) + 1;
      return acc;
    }, {});
    console.log('Distribution:', distribution);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
verify();
