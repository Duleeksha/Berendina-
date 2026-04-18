import pool from '../config/db.js';
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS resource_inventory (
      inventory_id SERIAL PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      total_stock INTEGER DEFAULT 0,
      available_stock INTEGER DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'pieces',
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS resource_requests (
      request_id SERIAL PRIMARY KEY,
      beneficiary_id INTEGER REFERENCES beneficiary(beneficiary_id),
      officer_id INTEGER REFERENCES user_table(user_id),
      project_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      request_note TEXT,
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS resource_request_items (
      id SERIAL PRIMARY KEY,
      request_id INTEGER REFERENCES resource_requests(request_id) ON DELETE CASCADE,
      inventory_id INTEGER REFERENCES resource_inventory(inventory_id),
      quantity INTEGER DEFAULT 1
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS resource_allocations (
      allocation_id SERIAL PRIMARY KEY,
      inventory_id INTEGER REFERENCES resource_inventory(inventory_id),
      beneficiary_id INTEGER REFERENCES beneficiary(beneficiary_id),
      quantity INTEGER DEFAULT 1,
      status VARCHAR(50) DEFAULT 'Delivered',
      delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      return_date TIMESTAMP,
      admin_notes TEXT
    )`);
    const check = await client.query('SELECT COUNT(*) FROM resource_inventory');
    if (parseInt(check.rows[0].count) === 0) {
      await client.query(`INSERT INTO resource_inventory (item_name, category, total_stock, available_stock, unit) VALUES 
        ('Water Tank (500L)', 'Infrastructure', 20, 20, 'units'),
        ('Sewing Machine', 'Livelihood', 15, 15, 'units'),
        ('Solar Lamp', 'Energy', 50, 50, 'pieces'),
        ('Agricultural Seeds Pack', 'Agriculture', 100, 100, 'packs')
      `);
    }
    await client.query('COMMIT');
    console.log('Migration successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}
migrate();
