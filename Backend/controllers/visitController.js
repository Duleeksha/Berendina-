import pool from '../config/db.js';
import transporter from '../config/mail.js';
import { uploadToSupabase } from '../middleware/upload.js';

export const getFieldVisits = async (req, res) => {
  const { officerId } = req.query;
  try {
    let query = `
      SELECT v.visit_id AS id, v.beneficiary_name AS beneficiary, v.district, v.address, v.visit_date::TEXT AS date, v.visit_time AS time, v.status, v.notes, v.feedback, v.photos, v.is_new, u.first_name || ' ' || u.last_name AS officer_name
      FROM field_visits v
      JOIN user_table u ON v.officer_id = u.user_id
    `;
    const params = [];
    if (officerId) {
        query += ` WHERE v.officer_id = $1`;
        params.push(officerId);
    }
    query += ` ORDER BY v.visit_date DESC, v.visit_time DESC;`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addFieldVisit = async (req, res) => {
  const { beneficiary, district, address, date, time, officerId, status, notes, feedback } = req.body;
  const photos = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'field-visits'))) : [];

  console.log("Scheduling Visit for:", { beneficiary, officerId, date });

  try {
    const query = `
      INSERT INTO field_visits (beneficiary_name, district, address, visit_date, visit_time, officer_id, status, notes, feedback, photos, is_new)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
      RETURNING *;
    `;
    const parsedOfficerId = parseInt(officerId);
    if (isNaN(parsedOfficerId)) {
        return res.status(400).json({ message: 'Invalid Officer ID' });
    }

    const values = [
      beneficiary || "", 
      district || "", 
      address || "", 
      date || null, 
      time || null, 
      parsedOfficerId, 
      status || 'scheduled', 
      notes || "", 
      feedback || "", 
      photos
    ];
    const result = await pool.query(query, values);
    
    // Notify officer
    try {
      const officerRes = await pool.query('SELECT email, first_name, last_name FROM user_table WHERE user_id = $1', [parsedOfficerId]);
      if (officerRes.rows.length > 0) {
          const officer = officerRes.rows[0];
          await transporter.sendMail({
              from: '"Berendina System" <noreply@berendina.org>',
              to: officer.email,
              subject: 'New Field Visit Scheduled',
              html: `<b>Hello ${officer.first_name} ${officer.last_name},</b><p>A new field visit has been scheduled for <b>${beneficiary}</b> on ${date}.</p>`
          });
      }
    } catch (err) { console.error('Email notification failed:', err); }

    res.status(201).json({ message: 'Visit scheduled!', data: result.rows[0] });
  } catch (error) {
    console.error("Add Visit SQL Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFieldVisit = async (req, res) => {
  const { id } = req.params;
  const { notes, feedback, status } = req.body;
  const photos = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'field-visits'))) : [];

  try {
    let query, values;
    if (photos.length > 0) {
      query = `UPDATE field_visits SET notes=$1, feedback=$2, status=$3, photos=array_cat(photos, $4) WHERE visit_id=$5 RETURNING *;`;
      values = [notes, feedback, status, photos, id];
    } else {
      query = `UPDATE field_visits SET notes=$1, feedback=$2, status=$3 WHERE visit_id=$4 RETURNING *;`;
      values = [notes, feedback, status, id];
    }
    const result = await pool.query(query, values);

    if (status === 'completed') {
        try {
            await transporter.sendMail({
                from: '"Berendina System" <noreply@berendina.org>',
                to: 'duleekshabandara@gmail.com',
                subject: 'Visit Completed',
                html: `<p>A field visit for <b>${result.rows[0].beneficiary_name}</b> has been marked as <b>Completed</b>.</p>`
            });
        } catch (err) { console.error('Admin notification failed:', err); }
    }

    res.json({ message: 'Visit updated!', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  const { visitIds } = req.body;
  try {
    await pool.query('UPDATE field_visits SET is_new = FALSE WHERE visit_id = ANY($1)', [visitIds]);
    res.json({ message: 'Visits marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
