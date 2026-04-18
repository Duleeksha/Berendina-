import pool from '../config/db.js';
const DIVISIONS = ['Ambagamuwa', 'Nuwara Eliya', 'Walapane', 'Kothmale', 'Hanguranketha'];
async function assignDivisions() {
  try {
    const res = await pool.query("SELECT user_id, first_name, last_name FROM user_table WHERE role = 'officer'");
    console.log(`Found ${res.rows.length} officers in user_table.`);
    for (const officer of res.rows) {
      const randomDivision = DIVISIONS[Math.floor(Math.random() * DIVISIONS.length)];
      const detailsCheck = await pool.query('SELECT user_id FROM officer_details WHERE user_id = $1', [officer.user_id]);
      if (detailsCheck.rows.length > 0) {
        await pool.query(
          'UPDATE officer_details SET ds_division = $1 WHERE user_id = $2',
          [randomDivision, officer.user_id]
        );
        console.log(`Updated officer ${officer.user_id} (${officer.first_name}) to ${randomDivision}`);
      } else {
        await pool.query(
          `INSERT INTO officer_details 
          (user_id, mobile_no, ds_division, vehicle_type, vehicle_no, languages) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [officer.user_id, '0000000000', randomDivision, 'None', 'None', 'English']
        );
        console.log(`Created details and assigned officer ${officer.user_id} (${officer.first_name}) to ${randomDivision}`);
      }
    }
    console.log('Successfully assigned DS Divisions to all officers.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
assignDivisions();
