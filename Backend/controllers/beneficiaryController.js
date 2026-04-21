import pool from '../config/db.js';
import { uploadToSupabase } from '../middleware/upload.js';
/**
 * This function get all people who get help from Berendina.
 * We can filter by project or by the officer who is assigned to them.
 */
export const getBeneficiaries = async (req, res) => {
  const { project } = req.query;
  try {
    let query = `
      SELECT b.beneficiary_id AS id, 
             b.ben_first_name AS "firstName", 
             b.ben_last_name AS "lastName", 
             b.ben_first_name || ' ' || b.ben_last_name AS name,
             b.ben_contac_no AS contact, b.ben_project AS project, b.ben_status AS status, 
             COALESCE(b.ben_progress, 0) AS progress, b.ben_nic AS nic, b.ben_dob AS dob, 
             b.ben_gender AS gender, b.ben_address AS address, 
             b.ben_ds_division AS "dsDivision", b.ben_marital_status AS "maritalStatus", 
             b.ben_family_members AS "familyMembers", b.ben_monthly_income AS "monthlyIncome", 
             b.ben_occupation AS occupation, b.documents, b.assigned_officer_id,
             u.first_name || ' ' || u.last_name AS assigned_officer_name
      FROM beneficiary b
      LEFT JOIN user_table u ON b.assigned_officer_id = u.user_id
    `;
    const params = [];
    let whereClauses = [];
    if (project) {
        params.push(project);
        whereClauses.push(`REGEXP_REPLACE(LOWER(b.ben_project), '\\s+', '', 'g') = REGEXP_REPLACE(LOWER($${params.length}), '\\s+', '', 'g')`);
    }
    if (req.query.officerId && req.query.officerId !== 'undefined') {
        const officerId = parseInt(req.query.officerId);
        if (!isNaN(officerId)) {
            params.push(officerId);
            whereClauses.push(`b.assigned_officer_id = $${params.length}`);
            console.log(`[BeneficiaryFilter] Applying strict filter for officerId: ${officerId}`);
        } else {
            console.warn(`[BeneficiaryFilter] Invalid officerId received: ${req.query.officerId}`);
        }
    }
    if (whereClauses.length > 0) {
        query += ` WHERE ` + whereClauses.join(' AND ');
    }
    query += ` ORDER BY b.beneficiary_id DESC;`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This help to add a new person to our system.
 * we save their name, NIC, and other details.
 * If they have documents, we upload them to the cloud.
 */
export const addBeneficiary = async (req, res) => {
  const { 
    firstName, lastName, nic, dob, gender, address, contact, dsDivision, 
    maritalStatus, familyMembers, monthlyIncome, occupation, project, status,
    assigned_officer_id
  } = req.body;
  const documents = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'beneficiaries'))) : [];
  try {
    const query = `
      INSERT INTO beneficiary (
        ben_first_name, ben_last_name, ben_nic, ben_dob, ben_gender, ben_address, ben_contac_no, 
        ben_ds_division, ben_marital_status, ben_family_members, 
        ben_monthly_income, ben_occupation, ben_project, ben_status, ben_progress, documents,
        assigned_officer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *;
    `;
    const values = [
      firstName || "", lastName || "", nic || "", dob || null, gender || "", address || "", contact || "", 
      dsDivision || "", maritalStatus || "", 
      familyMembers ? parseInt(familyMembers) : 0, 
      monthlyIncome ? parseFloat(monthlyIncome) : 0, 
      occupation || "", project || "", status || 'Active', 
      0, documents, assigned_officer_id || null
    ];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Beneficiary added!', data: result.rows[0] });
  } catch (error) {
    console.error("Add Beneficiary Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
/**
 * This part change the info for a person if they move house or 
 * change their phone number. We also can add more documents later.
 */
export const updateBeneficiary = async (req, res) => {
  const { id } = req.params;
  const { 
    firstName, lastName, nic, dob, gender, address, contact, dsDivision, 
    maritalStatus, familyMembers, monthlyIncome, occupation, project, status,
    assigned_officer_id
  } = req.body;
  const newDocs = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'beneficiaries'))) : [];
  try {
    let query, values;
    if (newDocs.length > 0) {
      query = `
        UPDATE beneficiary 
        SET ben_first_name=$1, ben_last_name=$2, ben_nic=$3, ben_dob=$4, ben_gender=$5, ben_address=$6, 
            ben_contac_no=$7, ben_ds_division=$8, ben_marital_status=$9, 
            ben_family_members=$10, ben_monthly_income=$11, ben_occupation=$12, 
            ben_project=$13, ben_status=$14, assigned_officer_id=$15,
            documents = array_cat(COALESCE(documents, ARRAY[]::TEXT[]), $16) 
        WHERE beneficiary_id=$17 RETURNING *;
      `;
        values = [
        firstName || "", lastName || "", nic || "", dob || null, gender || "", address || "", contact || "", 
        dsDivision || "", maritalStatus || "", 
        familyMembers ? parseInt(familyMembers) : 0, 
        monthlyIncome ? parseFloat(monthlyIncome) : 0, 
        occupation || "", project || "", status || 'active', 
        assigned_officer_id || null, newDocs, id
      ];
    } else {
      query = `
        UPDATE beneficiary 
        SET ben_first_name=$1, ben_last_name=$2, ben_nic=$3, ben_dob=$4, ben_gender=$5, ben_address=$6, 
            ben_contac_no=$7, ben_ds_division=$8, ben_marital_status=$9, 
            ben_family_members=$10, ben_monthly_income=$11, ben_occupation=$12, 
            ben_project=$13, ben_status=$14, assigned_officer_id=$15
        WHERE beneficiary_id=$16 RETURNING *;
      `;
      values = [
        firstName || "", lastName || "", nic || "", dob || null, gender || "", address || "", contact || "", 
        dsDivision || "", maritalStatus || "", 
        familyMembers ? parseInt(familyMembers) : 0, 
        monthlyIncome ? parseFloat(monthlyIncome) : 0, 
        occupation || "", project || "", status || 'active', 
        assigned_officer_id || null, id
      ];
    }
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Beneficiary not found or no changes made' });
    }
    res.json({ message: 'Beneficiary updated!', data: result.rows[0] });
  } catch (error) {
    console.error("Update Beneficiary Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
/**
 * This say how much the person is doing now.
 * We update the main number and also write in the history book.
 */
export const updateProgress = async (req, res) => {
  const { id } = req.params;
  const { progress, comment } = req.body;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE beneficiary SET ben_progress = $1 WHERE beneficiary_id = $2', [progress, id]);
    await pool.query('INSERT INTO progress_history (beneficiary_id, progress_value, comment) VALUES ($1, $2, $3)', [id, progress, comment]);
    await pool.query('COMMIT');
    res.json({ message: 'Progress updated!' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This show what happen to person before.
 * We list all the times their progress was updated.
 */
export const getHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM progress_history WHERE beneficiary_id = $1 ORDER BY update_date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This find person by their ID card number (NIC).
 * Very useful to check if person is already in our system.
 */
export const getBeneficiaryByNIC = async (req, res) => {
  const { nic } = req.params;
  try {
    const result = await pool.query('SELECT * FROM beneficiary WHERE ben_nic = $1', [nic]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Beneficiary not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * This remove person from out system.
 * We delete them using their ID. This is serious, be careful!
 */
export const deleteBeneficiary = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM beneficiary WHERE beneficiary_id = $1 RETURNING beneficiary_id AS id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Beneficiary not found' });
        }
        res.json({ message: 'Beneficiary deleted successfully!', id: result.rows[0].id });
    } catch (error) {
        console.error('Delete Beneficiary Error:', error);
        res.status(500).json({ message: 'Server error deleting beneficiary' });
    }
};
