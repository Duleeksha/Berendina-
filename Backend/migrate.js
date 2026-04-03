import pool from './db.js';

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // 1. Create progress_history table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS progress_history (
                history_id SERIAL PRIMARY KEY,
                beneficiary_id INTEGER REFERENCES beneficiary(beneficiary_id) ON DELETE CASCADE,
                progress_value INTEGER NOT NULL,
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                comment TEXT
            );
        `);
        console.log('✅ Created/Verified progress_history table.');

        // 2. Create field_visits table if missing
        await pool.query(`
            CREATE TABLE IF NOT EXISTS field_visits (
                visit_id SERIAL PRIMARY KEY,
                beneficiary_name VARCHAR(255),
                district VARCHAR(100),
                visit_date DATE,
                visit_time TIME,
                officer_id INTEGER REFERENCES user_table(user_id),
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                feedback TEXT,
                photo_url TEXT
            );
        `);
        console.log('✅ Created/Verified field_visits table with all columns.');

        // 3. Update resource table
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resource' AND column_name='status') THEN
                    ALTER TABLE resource ADD COLUMN status VARCHAR(50) DEFAULT 'Available';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resource' AND column_name='condition') THEN
                    ALTER TABLE resource ADD COLUMN condition VARCHAR(50) DEFAULT 'Good';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resource' AND column_name='allocated_to') THEN
                    ALTER TABLE resource ADD COLUMN allocated_to INTEGER REFERENCES beneficiary(beneficiary_id);
                END IF;
            END $$;
        `);
        console.log('✅ Updated resource table with status, condition, and allocation tracking.');

        console.log('🚀 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
