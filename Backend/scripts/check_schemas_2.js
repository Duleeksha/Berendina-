import pool from '../config/db.js';

async function checkSchemas() {
  try {
    const officerDetails = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'officer_details'");
    console.log('officer_details columns:', officerDetails.rows);

    const notifications = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notification'");
    console.log('notification columns:', notifications.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkSchemas();
