import pool from './Backend/db.js';
import fs from 'fs';

async function diagnose() {
    const report = [];
    try {
        await pool.query('SELECT COUNT(*) FROM beneficiary');
        report.push("Beneficiary table: OK");
    } catch (e) { report.push("Beneficiary table: FAILED - " + e.message); }

    try {
        await pool.query("SELECT COUNT(*) FROM project WHERE status = 'Active'");
        report.push("Project status: OK");
    } catch (e) { report.push("Project status: FAILED - " + e.message); }

    try {
        await pool.query('SELECT SUM(quantity) FROM resource');
        report.push("Resource sum: OK");
    } catch (e) { report.push("Resource sum: FAILED - " + e.message); }

    try {
        await pool.query("SELECT COUNT(*) FROM user_table WHERE status = 'Pending'");
        report.push("User status: OK");
    } catch (e) { report.push("User status: FAILED - " + e.message); }

    try {
        await pool.query("SELECT created_at FROM beneficiary LIMIT 1");
        report.push("Beneficiary created_at: OK");
    } catch (e) { report.push("Beneficiary created_at: MISSING"); }

    fs.writeFileSync('db_diag.txt', report.join('\n'));
    process.exit(0);
}

diagnose();
