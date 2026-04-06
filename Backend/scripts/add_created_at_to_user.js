import pool from '../config/db.js';

const run = async () => {
    try {
        console.log('Checking user_table for created_at column...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='created_at') THEN
                    ALTER TABLE user_table ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
            END $$;
        `);
        console.log('✅ Success: created_at column ensured in user_table.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating user_table:', err.message);
        process.exit(1);
    }
};

run();
