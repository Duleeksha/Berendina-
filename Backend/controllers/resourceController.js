import pool from '../config/db.js';

export const getResources = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.resource_id AS id, 
        r.res_name AS name, 
        r.quantity, 
        r.condition, 
        r.project_name AS project,
        TO_CHAR(r.issuing_date, 'YYYY-MM-DD') AS "issuingDate",
        r.allocated_to AS "allocatedToId", 
        b.ben_name AS "allocatedToName"
      FROM resource r
      LEFT JOIN beneficiary b ON r.allocated_to = b.beneficiary_id
      ORDER BY r.resource_id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

export const addResource = async (req, res) => {
  const { name, quantity, condition, project, issuingDate, allocatedToId } = req.body;
  try {
    const query = `
      INSERT INTO resource (res_name, quantity, condition, project_name, issuing_date, allocated_to, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING resource_id AS id, res_name AS name, quantity, condition, project_name AS project, TO_CHAR(issuing_date, 'YYYY-MM-DD') AS "issuingDate";
    `;
    const status = allocatedToId ? 'Allocated' : 'Available';
    const result = await pool.query(query, [name, quantity, condition || 'Good', project, issuingDate || null, allocatedToId || null, status]);
    res.status(201).json({ message: 'Resource added successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ message: 'Server error adding resource' });
  }
};

export const updateResource = async (req, res) => {
  const { id } = req.params;
    const { name, quantity, condition, project, issuingDate, allocatedToId } = req.body;
    const status = allocatedToId ? 'Allocated' : 'Available';
    try {
      const query = `
        UPDATE resource SET 
          res_name = $1, quantity = $2, condition = $3, 
          project_name = $4, issuing_date = $5, allocated_to = $6,
          status = $7
        WHERE resource_id = $8
        RETURNING resource_id AS id, res_name AS name, quantity, condition, status, project_name AS project, TO_CHAR(issuing_date, 'YYYY-MM-DD') AS "issuingDate", allocated_to AS "allocatedToId";
      `;
      const result = await pool.query(query, [name, quantity, condition, project, issuingDate || null, allocatedToId || null, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json({ message: 'Resource updated successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error updating resource' });
  }
};

export const deleteResource = async (req, res) => {
  const { id } = req.params;
  console.log(`[RESOURCE DELETE] Received request for Resource ID: ${id}`);
  
  try {
    const result = await pool.query('DELETE FROM resource WHERE resource_id = $1 RETURNING resource_id AS id', [id]);
    
    if (result.rows.length === 0) {
      console.warn(`[RESOURCE DELETE] Resource ID ${id} not found.`);
      return res.status(404).json({ message: 'Resource not found in database.' });
    }
    
    console.log(`[RESOURCE DELETE] Successfully deleted Resource ID: ${id}`);
    res.json({ message: 'Resource deleted successfully!', id: result.rows[0].id });
  } catch (error) {
    console.error(`[RESOURCE DELETE] FAILED for ID ${id}:`, error.message);
    res.status(500).json({ message: 'Server error during deletion: ' + error.message });
  }
};
