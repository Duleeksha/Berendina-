import pool from '../config/db.js';
import { uploadToSupabase } from '../middleware/upload.js';

export const getBeneficiaries = async (req, res) => {
  const { project } = req.query;
  try {
    let query = `
      SELECT b.beneficiary_id AS id, b.ben_name AS name, b.ben_contac_no AS contact, b.ben_project AS project, b.ben_status AS status, COALESCE(b.ben_progress, 0) AS progress, b.ben_nic AS nic, b.ben_dob AS dob, b.ben_gender AS gender, b.ben_address AS address, b.ben_district AS district, b.ben_ds_division AS "dsDivision", b.ben_marital_status AS "maritalStatus", b.ben_family_members AS "familyMembers", b.ben_monthly_income AS "monthlyIncome", b.ben_occupation AS occupation, b.documents
      FROM beneficiary b
    `;
    const params = [];
    if (project) {
        query += ` WHERE REGEXP_REPLACE(LOWER(b.ben_project), '\\s+', '', 'g') = REGEXP_REPLACE(LOWER($1), '\\s+', '', 'g')`;
        params.push(project);
    }
    query += ` ORDER BY b.beneficiary_id DESC;`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addBeneficiary = async (req, res) => {
  const { 
    name, nic, dob, gender, address, contact, district, dsDivision, 
    maritalStatus, familyMembers, monthlyIncome, occupation, project, status 
  } = req.body;
  const documents = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'beneficiaries'))) : [];

  try {
    const query = `
      INSERT INTO beneficiary (
        ben_name, ben_nic, ben_dob, ben_gender, ben_address, ben_contac_no, 
        ben_district, ben_ds_division, ben_marital_status, ben_family_members, 
        ben_monthly_income, ben_occupation, ben_project, ben_status, ben_progress, documents
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
      RETURNING *;
    `;
    const values = [
      name || "", nic || "", dob || null, gender || "", address || "", contact || "", 
      district || "", dsDivision || "", maritalStatus || "", parseInt(familyMembers) || 0, 
      parseInt(monthlyIncome) || 0, occupation || "", project || "", status || 'Active', 
      0, documents
    ];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Beneficiary added!', data: result.rows[0] });
  } catch (error) {
    console.error("Add Beneficiary Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateBeneficiary = async (req, res) => {
  const { id } = req.params;
  const { 
    name, nic, dob, gender, address, contact, district, dsDivision, 
    maritalStatus, familyMembers, monthlyIncome, occupation, project, status 
  } = req.body;
  const newDocs = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'beneficiaries'))) : [];

  try {
    let query, values;
    if (newDocs.length > 0) {
      query = `
        UPDATE beneficiary 
        SET ben_name=$1, ben_nic=$2, ben_dob=$3, ben_gender=$4, ben_address=$5, 
            ben_contac_no=$6, ben_district=$7, ben_ds_division=$8, ben_marital_status=$9, 
            ben_family_members=$10, ben_monthly_income=$11, ben_occupation=$12, 
            ben_project=$13, ben_status=$14, 
            documents = array_cat(COALESCE(documents, ARRAY[]::TEXT[]), $15) 
        WHERE beneficiary_id=$16 RETURNING *;
      `;
      values = [
        name || "", nic || "", dob || null, gender || "", address || "", contact || "", 
        district || "", dsDivision || "", maritalStatus || "", parseInt(familyMembers) || 0, 
        parseInt(monthlyIncome) || 0, occupation || "", project || "", status || 'active', 
        newDocs, id
      ];
    } else {
      query = `
        UPDATE beneficiary 
        SET ben_name=$1, ben_nic=$2, ben_dob=$3, ben_gender=$4, ben_address=$5, 
            ben_contac_no=$6, ben_district=$7, ben_ds_division=$8, ben_marital_status=$9, 
            ben_family_members=$10, ben_monthly_income=$11, ben_occupation=$12, 
            ben_project=$13, ben_status=$14 
        WHERE beneficiary_id=$15 RETURNING *;
      `;
      values = [
        name || "", nic || "", dob || null, gender || "", address || "", contact || "", 
        district || "", dsDivision || "", maritalStatus || "", parseInt(familyMembers) || 0, 
        parseInt(monthlyIncome) || 0, occupation || "", project || "", status || 'active', 
        id
      ];
    }
    const result = await pool.query(query, values);
    res.json({ message: 'Beneficiary updated!', data: result.rows[0] });
  } catch (error) {
    console.error("Update Beneficiary Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

export const getHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM progress_history WHERE beneficiary_id = $1 ORDER BY update_date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

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

