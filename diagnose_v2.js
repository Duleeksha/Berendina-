import pool from './Backend/db.js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly from Backend folder
dotenv.config({ path: path.resolve('./Backend/.env') });

async function diagnose() {
    const report = [];
    console.log("Starting diagnosis...");

    const checkQuery = async (name, sql) => {
        try {
            const res = await pool.query(sql);
            report.push(`${name}: OK (${JSON.stringify(res.rows[0])})`);
        } catch (e) {
            report.push(`${name}: FAILED - ${e.message}`);
        }
    };

    await checkQuery("Beneficiary Count", 'SELECT COUNT(*) FROM beneficiary');
    await checkQuery("Active Projects", "SELECT COUNT(*) FROM project WHERE status = 'Active'");
    await checkQuery("Resource Sum", 'SELECT SUM(quantity) FROM resource');
    await checkQuery("Pending Users", "SELECT COUNT(*) FROM user_table WHERE status = 'Pending'");
    await checkQuery("Trend Column", "SELECT created_at FROM beneficiary LIMIT 1");
    // Check table names
    await checkQuery("Table list", "SELECT table_name FROM information_schema.tables WHERE table_schema='public'");

    fs.writeFileSync('db_diag_v2.txt', report.join('\n'));
    console.log("Diagnosis complete. Report saved to db_diag_v2.txt");
    process.exit(0);
}

diagnose();
