import pool from '../config/db.js';
async function findConflicts() {
  try {
    const query = `
      SELECT b.beneficiary_id, b.ben_first_name, b.ben_last_name, b.ben_name, u.first_name, u.last_name 
      FROM beneficiary b 
      JOIN user_table u ON b.assigned_officer_id = u.user_id 
      WHERE (LOWER(b.ben_first_name) = LOWER(u.first_name) AND LOWER(b.ben_last_name) = LOWER(u.last_name)) 
         OR (LOWER(b.ben_name) = LOWER(u.first_name || ' ' || u.last_name))
    `;
    const res = await pool.query(query);
    console.log('Conflicting records found:', res.rows.length);
    res.rows.forEach(row => {
      console.log(`- ID: ${row.beneficiary_id}, Ben: ${row.ben_first_name} ${row.ben_last_name} (${row.ben_name}) | Officer: ${row.first_name} ${row.last_name}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
findConflicts();
