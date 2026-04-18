import pool from './config/db.js';
async function checkData() {
    try {
        const benRes = await pool.query("SELECT beneficiary_id, ben_first_name, ben_last_name, ben_project FROM beneficiary WHERE ben_first_name LIKE '%Dinethya%'");
        console.log('BENEFICIARY:', JSON.stringify(benRes.rows, null, 2));
        if (benRes.rows.length > 0) {
            const benId = benRes.rows[0].beneficiary_id;
            const visitRes = await pool.query("SELECT visit_id, beneficiary_name, beneficiary_id FROM field_visits WHERE beneficiary_name LIKE '%Dinethya%'");
            console.log('VISIT RECORDS:', JSON.stringify(visitRes.rows, null, 2));
            const allocRes = await pool.query("SELECT * FROM resource_allocations WHERE beneficiary_id = $1", [benId]);
            console.log('ALLOCATIONS:', JSON.stringify(allocRes.rows, null, 2));
        } else {
            console.log('Dinethya not found in beneficiaries.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}
checkData();
