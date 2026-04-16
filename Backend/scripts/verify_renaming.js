import pool from '../config/db.js';

async function verify() {
  try {
    const conflictQuery = `
      SELECT b.beneficiary_id, b.ben_first_name, b.ben_last_name, b.ben_name, u.first_name, u.last_name 
      FROM beneficiary b 
      JOIN user_table u ON b.assigned_officer_id = u.user_id 
      WHERE (LOWER(b.ben_first_name) = LOWER(u.first_name) AND LOWER(b.ben_last_name) = LOWER(u.last_name)) 
         OR (LOWER(b.ben_name) = LOWER(u.first_name || ' ' || u.last_name))
    `;
    const res = await pool.query(conflictQuery);
    console.log('Remaining conflicts:', res.rows.length);
    if (res.rows.length > 0) {
      console.error('CRITICAL: Some conflicts still remain!');
      res.rows.forEach(r => console.log(`- ID: ${r.beneficiary_id}`));
    }

    const checkIds = [17, 18, 20, 21, 24, 23, 29, 30, 25, 26, 19, 22, 28, 34, 31, 32, 33];
    const renamedRes = await pool.query("SELECT beneficiary_id, ben_name FROM beneficiary WHERE beneficiary_id = ANY($1)", [checkIds]);
    console.log(`Renamed records found: ${renamedRes.rows.length}/17`);
    renamedRes.rows.forEach(r => console.log(`- ID ${r.beneficiary_id}: ${r.ben_name}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
