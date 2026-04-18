import pool from './config/db.js';
async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resource_allocations'
        `);
        console.log('COLUMNS:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit(0);
    }
}
checkSchema();
