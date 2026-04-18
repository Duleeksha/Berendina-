import pool from '../config/db.js';
async function updateSchema() {
  try {
    await pool.query(`
      ALTER TABLE officer_details 
      ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
    `);
    console.log('Successfully added is_available column to officer_details.');
    await pool.query(`
      UPDATE officer_details SET is_available = TRUE WHERE is_available IS NULL;
    `);
    process.exit(0);
  } catch (err) {
    console.error('Schema update failed:', err);
    process.exit(1);
  }
}
updateSchema();
