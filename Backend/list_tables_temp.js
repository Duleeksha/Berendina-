import pool from './config/db.js';
async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        console.log(JSON.stringify(res.rows.map(r => r.table_name), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
listTables();
