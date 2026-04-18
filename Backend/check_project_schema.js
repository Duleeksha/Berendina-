import pool from '../config/db.js';
const checkSchema = async () => {
    try {
        const result = await pool.query("SELECT * FROM project LIMIT 1");
        console.log("Columns in project table:", Object.keys(result.rows[0] || {}).join(", "));
        if (result.rows.length > 0) {
            console.log("Example Row Data:", JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log("Project table is empty.");
        }
    } catch (error) {
        console.error("Error checking schema:", error.message);
    } finally {
        process.exit();
    }
};
checkSchema();
