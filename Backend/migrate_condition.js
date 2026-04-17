import pool from './config/db.js';

async function migrate() {
    try {
        await pool.query("ALTER TABLE resource_allocations ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'Functional'");
        console.log('MIGRATION SUCCESS: condition column added to resource_allocations');
    } catch (err) {
        console.error('MIGRATION FAILED:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
