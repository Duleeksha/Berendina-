import pool from '../config/db.js';
import { uploadToSupabase } from '../middleware/upload.js';
/**
 * This part get all projects we are doing.
 * We list them with donor name, budget, and if they are still active.
 */
export const getProjects = async (req, res) => {
  try {
    const result = await pool.query('SELECT project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, \'YYYY-MM-DD\') AS start, TO_CHAR(end_date, \'YYYY-MM-DD\') AS "end", budget, status, description, image_url, created_at FROM project ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This function make a new project in system.
 * We save the dates and how much money is allowed (budget).
 * If there is a project image, we save it too.
 */
export const addProject = async (req, res) => {
  const { name, donor, location, start, end, budget, status, description } = req.body;
  const image_url = req.file ? await uploadToSupabase(req.file, 'projects') : null;
  console.log('Add Project Attempt:', { name, donor, location, start, end, image_url });
  try {
    const result = await pool.query(
      'INSERT INTO project (project_name, donor_agency, target_location, start_date, end_date, budget, status, description, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, \'YYYY-MM-DD\') AS start, TO_CHAR(end_date, \'YYYY-MM-DD\') AS "end", budget, status, description, image_url',
      [name, donor, location, start || null, end || null, budget || 0, status || 'Active', description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This part change project info.
 * Admin can change donor name, budget, or dates if project period is longer.
 */
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, donor, location, start, end, budget, status, description } = req.body;
  const image_url = req.file ? await uploadToSupabase(req.file, 'projects') : null;
  console.log('Update Project Attempt:', { id, name, location, image_url });
  try {
    let result;
    if (image_url) {
        result = await pool.query(
          `UPDATE project SET 
            project_name = $1, 
            donor_agency = $2, 
            target_location = $3, 
            start_date = $4, 
            end_date = $5, 
            budget = $6, 
            status = $7, 
            description = $8,
            image_url = $9
          WHERE project_id = $10 RETURNING project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, 'YYYY-MM-DD') AS start, TO_CHAR(end_date, 'YYYY-MM-DD') AS "end", budget, status, description, image_url`,
          [name, donor, location, start, end, budget, status, description, image_url, id]
        );
    } else {
        result = await pool.query(
          `UPDATE project SET 
            project_name = $1, 
            donor_agency = $2, 
            target_location = $3, 
            start_date = $4, 
            end_date = $5, 
            budget = $6, 
            status = $7, 
            description = $8 
          WHERE project_id = $9 RETURNING project_id AS id, project_name AS name, donor_agency AS donor, target_location AS location, TO_CHAR(start_date, 'YYYY-MM-DD') AS start, TO_CHAR(end_date, 'YYYY-MM-DD') AS "end", budget, status, description, image_url`,
          [name, donor, location, start, end, budget, status, description, id]
        );
    }
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
/**
 * This function remove project from system.
 * This will delete the main project record from the book.
 */
export const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM project WHERE project_id = $1 RETURNING project_id AS id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully!', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
