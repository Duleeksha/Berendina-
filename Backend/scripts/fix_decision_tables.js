import pool from '../config/db.js';

const q = [
  `CREATE TABLE IF NOT EXISTS resource_inventory (
    inventory_id SERIAL PRIMARY KEY, 
    item_name VARCHAR(255) NOT NULL, 
    category VARCHAR(100), 
    total_stock INTEGER DEFAULT 0, 
    available_stock INTEGER DEFAULT 0, 
    unit VARCHAR(50) DEFAULT 'units', 
    image_url TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS resource_allocations (
    allocation_id SERIAL PRIMARY KEY, 
    inventory_id INTEGER REFERENCES resource_inventory(inventory_id), 
    beneficiary_id INTEGER REFERENCES beneficiary(beneficiary_id), 
    quantity INTEGER NOT NULL, 
    status VARCHAR(50) DEFAULT 'Allocated', 
    delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    return_date TIMESTAMP, 
    admin_notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS resource_requests (
    request_id SERIAL PRIMARY KEY, 
    beneficiary_id INTEGER REFERENCES beneficiary(beneficiary_id), 
    officer_id INTEGER REFERENCES user_table(user_id), 
    project_name VARCHAR(255), 
    status VARCHAR(50) DEFAULT 'Pending', 
    request_note TEXT, 
    admin_notes TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS resource_request_items (
    request_item_id SERIAL PRIMARY KEY, 
    request_id INTEGER REFERENCES resource_requests(request_id) ON DELETE CASCADE, 
    inventory_id INTEGER REFERENCES resource_inventory(inventory_id), 
    quantity INTEGER NOT NULL
  )`
];

async function run() {
  console.log('Starting table verification...');
  for (const s of q) {
    try {
      await pool.query(s);
      console.log('✅ Success executing query');
    } catch (e) {
      console.error('❌ Failed:', e.message);
    }
  }
  console.log('Verification complete.');
  process.exit(0);
}

run();
