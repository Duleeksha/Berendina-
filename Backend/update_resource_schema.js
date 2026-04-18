import pool from './config/db.js';
async function migrate() {
  try {
    console.log('Starting migration for resource table...');
    await pool.query('ALTER TABLE resource ADD COLUMN IF NOT EXISTS issuing_date DATE;');
    console.log('Added column: issuing_date');
    await pool.query('ALTER TABLE resource ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);');
    console.log('Added column: project_name');
    await pool.query('ALTER TABLE resource ALTER COLUMN availability DROP NOT NULL;');
    console.log('Relaxed constraint: availability (now nullable)');
    await pool.query('ALTER TABLE resource ALTER COLUMN type DROP NOT NULL;');
    console.log('Relaxed constraint: type (now nullable)');
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
migrate();
