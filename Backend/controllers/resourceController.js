import pool from '../config/db.js';
import { uploadToSupabase } from '../middleware/upload.js';
// this part get all things we have in storage
export const getInventory = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resource_inventory ORDER BY item_name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error retrieving inventory' });
  }
};
// this help to add new item to storage
export const addInventoryItem = async (req, res) => {
  const { name, category, total_stock, unit } = req.body;
  const image_url = req.file ? await uploadToSupabase(req.file, 'resources') : null;
  try {
    const query = `
      INSERT INTO resource_inventory (item_name, category, total_stock, available_stock, unit, image_url)
      VALUES ($1, $2, $3, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, category, parseInt(total_stock), unit || 'units', image_url]);
    res.status(201).json({ message: 'Item added to inventory!', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ message: 'Server error adding inventory' });
  }
};
// this part change the info for item in storage
export const updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { name, category, total_stock, unit } = req.body;
  const image_url = req.file ? await uploadToSupabase(req.file, 'resources') : null;
  try {
    const currentRes = await pool.query('SELECT total_stock, available_stock FROM resource_inventory WHERE inventory_id = $1', [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    const current = currentRes.rows[0];
    const diff = parseInt(total_stock) - current.total_stock;
    const newAvailable = Math.max(0, current.available_stock + diff);
    const query = `
      UPDATE resource_inventory 
      SET item_name = $1, category = $2, total_stock = $3, available_stock = $4, unit = $5, image_url = COALESCE($6, image_url)
      WHERE inventory_id = $7
      RETURNING *;
    `;
    const result = await pool.query(query, [name, category, parseInt(total_stock), newAvailable, unit, image_url, id]);
    res.json({ message: 'Item updated successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Server error updating inventory' });
  }
};
// this remove item from storage forever
export const deleteInventoryItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM resource_inventory WHERE inventory_id = $1', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Server error deleting inventory' });
  }
};
// this help officer to ask for things for a person
export const createRequest = async (req, res) => {
  const { beneficiaryId, officerId, projectName, note, items } = req.body; 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requestQuery = `
      INSERT INTO resource_requests (beneficiary_id, officer_id, project_name, request_note)
      VALUES ($1, $2, $3, $4)
      RETURNING request_id;
    `;
    const requestRes = await client.query(requestQuery, [beneficiaryId, officerId, projectName, note]);
    const requestId = requestRes.rows[0].request_id;
    for (const item of items) {
      await client.query(
        'INSERT INTO resource_request_items (request_id, inventory_id, quantity) VALUES ($1, $2, $3)',
        [requestId, item.inventoryId, item.quantity]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Batch request submitted successfully!', requestId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Server error creating request' });
  } finally {
    client.release();
  }
};
// this show all the things people asked for
export const getRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.request_id AS id,
        b.ben_first_name || ' ' || b.ben_last_name AS "beneficiaryName",
        u.first_name || ' ' || u.last_name AS "officerName",
        r.project_name AS project,
        r.status,
        r.request_note AS note,
        r.created_at AS "date",
        json_agg(json_build_object(
          'name', inv.item_name,
          'qty', ri.quantity,
          'inventoryId', inv.inventory_id
        )) AS items
      FROM resource_requests r
      JOIN beneficiary b ON r.beneficiary_id = b.beneficiary_id
      JOIN user_table u ON r.officer_id = u.user_id
      JOIN resource_request_items ri ON r.request_id = ri.request_id
      JOIN resource_inventory inv ON ri.inventory_id = inv.inventory_id
      GROUP BY r.request_id, b.ben_first_name, b.ben_last_name, u.first_name, u.last_name
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Server error retrieving requests' });
  }
};
// this help admin to say YES or NO to request
export const processRequest = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body; 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateRes = await client.query(
      'UPDATE resource_requests SET status = $1, admin_notes = $2 WHERE request_id = $3 RETURNING *',
      [status, adminNotes, id]
    );
    if (status === 'Approved') {
      const itemsRes = await client.query('SELECT * FROM resource_request_items WHERE request_id = $1', [id]);
      const reqData = updateRes.rows[0];
      for (const item of itemsRes.rows) {
        const invRes = await client.query('SELECT available_stock FROM resource_inventory WHERE inventory_id = $1', [item.inventory_id]);
        if (invRes.rows[0].available_stock < item.quantity) {
          throw new Error(`Insufficient stock for item ID ${item.inventory_id}`);
        }
        await client.query(
          'UPDATE resource_inventory SET available_stock = available_stock - $1 WHERE inventory_id = $2',
          [item.quantity, item.inventory_id]
        );
        await client.query(
          'INSERT INTO resource_allocations (inventory_id, beneficiary_id, quantity, admin_notes) VALUES ($1, $2, $3, $4)',
          [item.inventory_id, reqData.beneficiary_id, item.quantity, adminNotes]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ message: `Request ${status} successfully!` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing request:', error);
    res.status(500).json({ message: error.message || 'Server error processing request' });
  } finally {
    client.release();
  }
};
// this show who got what things from us
export const getAllocations = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.allocation_id AS id,
        inv.item_name AS "resourceName",
        b.ben_first_name || ' ' || b.ben_last_name AS "beneficiaryName",
        a.quantity,
        a.status,
        TO_CHAR(a.delivery_date, 'YYYY-MM-DD') AS "deliveryDate",
        TO_CHAR(a.return_date, 'YYYY-MM-DD') AS "returnDate",
        a.admin_notes AS notes
      FROM resource_allocations a
      JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id
      JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id
      ORDER BY a.delivery_date DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Server error retrieving allocations' });
  }
};
// this function when person give back the item to us
export const returnResource = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const allocRes = await client.query('SELECT * FROM resource_allocations WHERE allocation_id = $1', [id]);
    if (allocRes.rows.length === 0) throw new Error('Allocation not found');
    const allocation = allocRes.rows[0];
    if (allocation.status === 'Returned') throw new Error('Resource already returned');
    await client.query(
      'UPDATE resource_inventory SET available_stock = available_stock + $1 WHERE inventory_id = $2',
      [allocation.quantity, allocation.inventory_id]
    );
    await client.query(
      "UPDATE resource_allocations SET status = 'Returned', return_date = CURRENT_TIMESTAMP WHERE allocation_id = $1",
      [id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Resource returned to stock!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error returning resource:', error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};
// this part let admin give thing directly to person
export const directAllocate = async (req, res) => {
  const { inventoryId, beneficiaryId, quantity, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query('SELECT available_stock FROM resource_inventory WHERE inventory_id = $1', [inventoryId]);
    if (invRes.rows[0].available_stock < quantity) {
      throw new Error('Insufficient stock');
    }
    await client.query(
      'UPDATE resource_inventory SET available_stock = available_stock - $1 WHERE inventory_id = $2',
      [quantity, inventoryId]
    );
    await client.query(
      'INSERT INTO resource_allocations (inventory_id, beneficiary_id, quantity, admin_notes) VALUES ($1, $2, $3, $4)',
      [inventoryId, beneficiaryId, quantity, notes]
    );
    await client.query('COMMIT');
    res.status(201).json({ message: 'Direct allocation successful!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Direct allocation error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};
