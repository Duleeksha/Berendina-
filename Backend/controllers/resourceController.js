import pool from '../config/db.js';

export const getResources = async (req, res) => {
  try {
    const query = `
      SELECT r.*, r.res_name AS name, b.ben_name AS allocated_to_name
      FROM resource r
      LEFT JOIN beneficiary b ON r.allocated_to = b.beneficiary_id
      ORDER BY r.resource_id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addResource = async (req, res) => {
  const { name, type, quantity, status, condition } = req.body;
  try {
    const query = `
      INSERT INTO resource (res_name, type, quantity, status, condition)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, type, quantity, status || 'Available', condition || 'Good']);
    res.status(201).json({ message: 'Resource added!', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateResource = async (req, res) => {
  const { id } = req.params;
  const { name, type, quantity, status, condition, allocatedToId } = req.body;
  try {
    const query = `
      UPDATE resource SET 
        res_name = $1, type = $2, quantity = $3, 
        status = $4, condition = $5, allocated_to = $6
      WHERE resource_id = $7
      RETURNING *;
    `;
    const result = await pool.query(query, [name, type, quantity, status, condition, allocatedToId || null, id]);
    res.json({ message: 'Resource updated!', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
