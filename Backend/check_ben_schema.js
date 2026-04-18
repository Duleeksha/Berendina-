import pool from './config/db.js';
async function checkBeneficiarySchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiary'
        `);
        console.log('BENEFICIARY COLUMNS:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit(0);
    }
}
checkBeneficiarySchema();
