import pool from './config/db.js';
import fs from 'fs';
async function generateSpec() {
    try {
        const tablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        const fullSpec = {};
        for (const table of tables) {
            try {
                const colRes = await pool.query(`
                    SELECT 
                        c.column_name, 
                        c.data_type, 
                        c.is_nullable, 
                        c.column_default,
                        (SELECT tc.constraint_type 
                         FROM information_schema.table_constraints tc
                         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                         WHERE kcu.table_name = c.table_name 
                         AND kcu.column_name = c.column_name 
                         AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
                         LIMIT 1) as constraint_type
                    FROM information_schema.columns c
                    WHERE c.table_name = $1
                    ORDER BY c.ordinal_position
                `, [table]);
                fullSpec[table] = {
                    columns: colRes.rows
                };
            } catch (e) {
                console.warn(`Skipping table ${table}: ${e.message}`);
            }
        }
        fs.writeFileSync('full_schema_utf8.json', JSON.stringify(fullSpec, null, 2), 'utf8');
        console.log('Successfully generated full_schema_utf8.json');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
generateSpec();
