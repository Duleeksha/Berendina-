import pool from '../config/db.js';

export const getProjects = async (req, res) => {
  try {
    const result = await pool.query('SELECT project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, \'YYYY-MM-DD\') AS start, TO_CHAR(end_date, \'YYYY-MM-DD\') AS "end", budget, status, description, created_at FROM project ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addProject = async (req, res) => {
  const { name, donor, location, start, end, budget, status, description } = req.body;
  
  console.log('Add Project Attempt:', { name, donor, location, start, end });

  try {
    const result = await pool.query(
      'INSERT INTO project (project_name, donor_agency, target_location, start_date, end_date, budget, status, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, \'YYYY-MM-DD\') AS start, TO_CHAR(end_date, \'YYYY-MM-DD\') AS "end", budget, status, description',
      [name, donor, location, start || null, end || null, budget || 0, status || 'Active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, donor, location, start, end, budget, status, description } = req.body;
  
  console.log('Update Project Attempt:', { id, name, location });

  try {
    const result = await pool.query(
      `UPDATE project SET 
        project_name = $1, 
        donor_agency = $2, 
        target_location = $3, 
        start_date = $4, 
        end_date = $5, 
        budget = $6, 
        status = $7, 
        description = $8 
      WHERE project_id = $9 RETURNING project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, 'YYYY-MM-DD') AS start, TO_CHAR(end_date, 'YYYY-MM-DD') AS "end", budget, status, description`,
      [name, donor, location, start, end, budget, status, description, id]
    );
    
    console.log('Update Result Rows:', result.rowCount);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
