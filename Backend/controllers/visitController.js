import pool from '../config/db.js';
import transporter from '../config/mail.js';
import { uploadToSupabase } from '../middleware/upload.js';

export const getFieldVisits = async (req, res) => {
  const { officerId } = req.query;
  try {
    let query = `
      SELECT 
        v.visit_id AS id, 
        v.beneficiary_name AS beneficiary, 
        v.district, 
        v.address, 
        v.visit_date::TEXT AS date, 
        v.visit_time AS time, 
        v.status, 
        v.notes, 
        v.feedback, 
        v.photos, 
        v.is_new, 
        v.beneficiary_id,
        u.first_name || ' ' || u.last_name AS officer_name,
        COALESCE(p.project_name, b.ben_project, 'No Project Assigned') AS project_name,
        b.ben_progress AS beneficiary_progress,
        (
          SELECT json_agg(json_build_object('id', a.allocation_id, 'name', inv.item_name, 'condition', COALESCE(a.condition, 'Functional')))
          FROM resource_allocations a
          JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id
          WHERE a.beneficiary_id = v.beneficiary_id AND a.status != 'Returned'
        ) AS allocated_resources
      FROM field_visits v
      JOIN user_table u ON v.officer_id = u.user_id
      LEFT JOIN beneficiary b ON v.beneficiary_id = b.beneficiary_id
      LEFT JOIN project p ON b.project_id = p.project_id
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
  const { beneficiary, beneficiaryId, district, address, date, time, officerId, status, notes, feedback } = req.body;
  const photos = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'field-visits'))) : [];

  console.log("Scheduling Visit for:", { beneficiary, officerId, date });

  try {
    const query = `
      INSERT INTO field_visits (beneficiary_name, beneficiary_id, district, address, visit_date, visit_time, officer_id, status, notes, feedback, photos, is_new)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
      RETURNING *;
    `;
    const parsedOfficerId = parseInt(officerId);
    if (isNaN(parsedOfficerId)) {
        return res.status(400).json({ message: 'Invalid Officer ID' });
    }

    const values = [
      beneficiary || "", 
      beneficiaryId || null,
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
    
    // Fetch extra details for the email (Project & Resources)
    let emailProject = "N/A";
    let emailResources = [];
    if (beneficiaryId) {
        try {
            const extraRes = await pool.query(`
                SELECT p.project_name, 
                (SELECT json_agg(inv.item_name) 
                 FROM resource_allocations a 
                 JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id 
                 WHERE a.beneficiary_id = $1 AND a.status = 'Allocated') as resources
                FROM beneficiary b
                LEFT JOIN project p ON b.project_id = p.project_id
                WHERE b.beneficiary_id = $1
            `, [beneficiaryId]);
            
            if (extraRes.rows.length > 0) {
                emailProject = extraRes.rows[0].project_name || "N/A";
                emailResources = extraRes.rows[0].resources || [];
            }
        } catch (err) { console.error('Error fetching email details:', err); }
    }

    // Notify officer with full details
    try {
      const officerRes = await pool.query('SELECT email, first_name, last_name FROM user_table WHERE user_id = $1', [parsedOfficerId]);
      if (officerRes.rows.length > 0) {
          const officer = officerRes.rows[0];
          const resourceListHtml = emailResources.length > 0 
            ? `<ul>${emailResources.map(r => `<li>📦 ${r}</li>`).join('')}</ul>` 
            : '<i>No specific resources allocated.</i>';

          await transporter.sendMail({
              from: '"Berendina System" <noreply@berendina.org>',
              to: officer.email,
              subject: `📅 New Field Visit: ${beneficiary}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; color: #333;">
                    <div style="background: #0081c9; padding: 20px; color: white; text-align: center;">
                        <h2 style="margin: 0;">New Field Visit Scheduled</h2>
                    </div>
                    <div style="padding: 25px;">
                        <p>Hello <b>${officer.first_name}</b>,</p>
                        <p>A new field visit has been assigned to you. Please see the full details below:</p>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin-top: 0; color: #0081c9; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">📍 Assignment Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 5px 0; color: #666; width: 120px;"><b>Beneficiary:</b></td><td style="padding: 5px 0;">${beneficiary}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><b>Project:</b></td><td style="padding: 5px 0;">${emailProject}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><b>Date:</b></td><td style="padding: 5px 0;">${date}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><b>Time:</b></td><td style="padding: 5px 0;">${time}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><b>Location:</b></td><td style="padding: 5px 0;">${address}, ${district}</td></tr>
                            </table>
                        </div>

                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0081c9;">
                            <h3 style="margin-top: 0; color: #0c4a6e;">📦 Resources to Audit</h3>
                            ${resourceListHtml}
                        </div>

                        <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffb300;">
                            <h3 style="margin-top: 0; color: #7f5f01;">📝 Notes from Administrator</h3>
                            <p style="margin: 0;">${notes || "No special notes provided."}</p>
                        </div>

                        <p style="font-size: 13px; color: #666; font-style: italic;">
                            Please ensure you record the visit results and resource conditions in your officer dashboard upon completion.
                        </p>
                    </div>
                    <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 11px; color: #888;">
                        This is an automated message from the Berendina System.
                    </div>
                </div>
              `
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
  const { notes, feedback, status, resourceUpdates, beneficiaryProgress, beneficiaryPhase } = req.body;
  const photos = req.files ? await Promise.all(req.files.map(f => uploadToSupabase(f, 'field-visits'))) : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let query, values;
    if (photos.length > 0) {
      query = `UPDATE field_visits SET notes=$1, feedback=$2, status=$3, photos=array_cat(photos, $4), is_new=FALSE WHERE visit_id=$5 RETURNING *;`;
      values = [notes, feedback, status, photos, id];
    } else {
      query = `UPDATE field_visits SET notes=$1, feedback=$2, status=$3, is_new=FALSE WHERE visit_id=$4 RETURNING *;`;
      values = [notes, feedback, status, id];
    }
    const result = await client.query(query, values);
    const visitData = result.rows[0];

    // Handle Resource Audit Updates
    if (resourceUpdates && Array.isArray(resourceUpdates)) {
        for (const update of resourceUpdates) {
            await client.query(
                'UPDATE resource_allocations SET condition = $1 WHERE allocation_id = $2',
                [update.condition, update.id]
            );

            // Trigger Admin Alert if Damaged or Repair
            if (update.condition === 'Damaged' || update.condition === 'Repair') {
                const adminIdsRes = await client.query("SELECT user_id FROM user_table WHERE role = 'admin' AND status = 'Active'");
                const alertMsg = `ALERT: Resource '${update.name}' reported as '${update.condition}' during visit for ${visitData.beneficiary_name}.`;
                
                for (const admin of adminIdsRes.rows) {
                    await client.query(
                        'INSERT INTO notification (user_id, message, sent_at, read_status) VALUES ($1, $2, NOW(), FALSE)',
                        [admin.user_id, alertMsg]
                    );
                }
            }
        }
    }

    // Update Beneficiary Overall Progress if provided
    if (beneficiaryProgress !== undefined && visitData.beneficiary_id) {
        await client.query('UPDATE beneficiary SET ben_progress = $1 WHERE beneficiary_id = $2', [beneficiaryProgress, visitData.beneficiary_id]);
        
        // Log in progress history
        const logComment = beneficiaryPhase 
            ? `Phase updated to: ${beneficiaryPhase} (via Visit #${id})`
            : `Progress updated via Field Visit #${id}`;
            
        await client.query(
            'INSERT INTO progress_history (beneficiary_id, progress_value, comment, update_date) VALUES ($1, $2, $3, NOW())', 
            [visitData.beneficiary_id, beneficiaryProgress, logComment]
        );
    }

    if (status === 'completed') {
        try {
            await transporter.sendMail({
                from: '"Berendina System" <noreply@berendina.org>',
                to: 'duleekshabandara@gmail.com',
                subject: 'Visit Completed',
                html: `<p>A field visit for <b>${visitData.beneficiary_name}</b> has been marked as <b>Completed</b>.</p>`
            });
        } catch (err) { console.error('Admin notification failed:', err); }
    }

    await client.query('COMMIT');
    res.json({ message: 'Visit and Resource Audit updated!', data: visitData });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('updateFieldVisit error:', error);
    res.status(500).json({ message: 'Server error updating visit' });
  } finally {
    client.release();
  }
};

export const markAsRead = async (req, res) => {
  const { visitIds, userId } = req.body;
  try {
    if (visitIds && visitIds.length > 0) {
      await pool.query('UPDATE field_visits SET is_new = FALSE WHERE visit_id = ANY($1)', [visitIds]);
    } else if (userId) {
      await pool.query('UPDATE field_visits SET is_new = FALSE WHERE officer_id = $1', [userId]);
    }
    res.json({ message: 'Visits marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
