import pool from '../config/db.js';

async function research() {
  try {
    // Check columns for beneficiary
    const benCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiary'");
    console.log('Beneficiary columns:', benCols.rows.map(r => r.column_name));

    // Check columns for user_table
    const userCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_table'");
    console.log('User columns:', userCols.rows.map(r => r.column_name));

    // Find conflicts
    // We assume beneficiary has officer_id and name fields
    // Looking at previous conversations/code, beneficiary has 'first_name', 'last_name' OR 'name'
    // Let's check what's actually there.
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

research();
