import pool from './config/db.js';
const addColumns = async () => {
    try {
        console.log('Adding new registration columns...');
        await pool.query(`
            DO $$ 
            BEGIN 
                -- Add Employee Info
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='employee_id') THEN
                    ALTER TABLE user_table ADD COLUMN employee_id VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='department') THEN
                    ALTER TABLE user_table ADD COLUMN department VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='branch') THEN
                    ALTER TABLE user_table ADD COLUMN branch VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='job_title') THEN
                    ALTER TABLE user_table ADD COLUMN job_title VARCHAR(100);
                END IF;
                -- Add General Info
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='gender') THEN
                    ALTER TABLE user_table ADD COLUMN gender VARCHAR(20);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='terms_accepted') THEN
                    ALTER TABLE user_table ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
                END IF;
                -- Add Organization (already exists in some forms, ensuring it's in DB)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_table' AND column_name='organization') THEN
                    ALTER TABLE user_table ADD COLUMN organization VARCHAR(255);
                END IF;
            END $$;
        `);
        console.log('✅ Updated user_table columns.');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='officer_details' AND column_name='emergency_contact') THEN
                    ALTER TABLE officer_details ADD COLUMN emergency_contact VARCHAR(20);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='officer_details' AND column_name='base_location') THEN
                    ALTER TABLE officer_details ADD COLUMN base_location VARCHAR(255);
                END IF;
            END $$;
        `);
        console.log('✅ Updated officer_details columns.');
        console.log('🚀 Registration fields added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to add columns:', err.message);
        process.exit(1);
    }
};
addColumns();
