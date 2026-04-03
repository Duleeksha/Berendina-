import pool from './Backend/db.js';

async function debugStats() {
    console.log("--- DEBUGGING DASHBOARD STATS ---");
    
    try {
        const benCount = await pool.query('SELECT COUNT(*) FROM beneficiary');
        console.log("Beneficiary Count OK:", benCount.rows[0].count);
    } catch (e) { console.error("Beneficiary Count FAILED:", e.message); }

    try {
        const projCount = await pool.query("SELECT COUNT(*) FROM project WHERE status = 'Active'");
        console.log("Active Project Count OK:", projCount.rows[0].count);
    } catch (e) { console.error("Active Project Count FAILED:", e.message); }

    try {
        const resCount = await pool.query('SELECT SUM(quantity) FROM resource');
        console.log("Resource SUM OK:", resCount.rows[0].sum);
    } catch (e) { console.error("Resource SUM FAILED:", e.message); }

    try {
        const pendingCount = await pool.query("SELECT COUNT(*) FROM user_table WHERE status = 'Pending'");
        console.log("Pending User Count OK:", pendingCount.rows[0].count);
    } catch (e) { console.error("Pending User Count FAILED:", e.message); }

    try {
        const trendQuery = `
          SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as beneficiaries
          FROM beneficiary
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at);
        `;
        const trendRes = await pool.query(trendQuery);
        console.log("Trend Query OK:", trendRes.rows.length, "rows");
    } catch (e) { console.error("Trend Query FAILED:", e.message); }

    try {
        const distQuery = `
          SELECT ben_project AS name, COUNT(*) AS beneficiaries 
          FROM beneficiary 
          WHERE ben_project IS NOT NULL AND ben_project != ''
          GROUP BY ben_project
          LIMIT 6;
        `;
        const distRes = await pool.query(distQuery);
        console.log("Distribution Query OK:", distRes.rows.length, "rows");
    } catch (e) { console.error("Distribution Query FAILED:", e.message); }

    process.exit(0);
}

debugStats();
