import pool from './config/db.js';

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

        // 2. Create/Update field_visits table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS field_visits (
                visit_id SERIAL PRIMARY KEY,
                beneficiary_name VARCHAR(255),
                district VARCHAR(100),
                address TEXT,
                visit_date DATE,
                visit_time TIME,
                officer_id INTEGER REFERENCES user_table(user_id),
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                feedback TEXT,
                photos TEXT[] DEFAULT ARRAY[]::TEXT[],
                is_new BOOLEAN DEFAULT TRUE
            );
        `);
        // Ensure necessary columns exist (if table already existed)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='field_visits' AND column_name='photos') THEN
                    ALTER TABLE field_visits ADD COLUMN photos TEXT[] DEFAULT ARRAY[]::TEXT[];
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='field_visits' AND column_name='is_new') THEN
                    ALTER TABLE field_visits ADD COLUMN is_new BOOLEAN DEFAULT TRUE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='field_visits' AND column_name='address') THEN
                    ALTER TABLE field_visits ADD COLUMN address TEXT;
                END IF;
            END $$;
        `);
        console.log('✅ Created/Verified field_visits table.');

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
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resource' AND column_name='image_url') THEN
                    ALTER TABLE resource ADD COLUMN image_url TEXT;
                END IF;
            END $$;
        `);
        console.log('✅ Updated resource table.');

        // 4. Update project table
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project' AND column_name='image_url') THEN
                    ALTER TABLE project ADD COLUMN image_url TEXT;
                END IF;
            END $$;
        `);
        console.log('✅ Updated project table.');

        // 5. Update beneficiary table
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beneficiary' AND column_name='documents') THEN
                    ALTER TABLE beneficiary ADD COLUMN documents TEXT[] DEFAULT ARRAY[]::TEXT[];
                END IF;
            END $$;
        `);
        console.log('✅ Updated beneficiary table.');


        console.log('🚀 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
