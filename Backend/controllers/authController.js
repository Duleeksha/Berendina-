import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import transporter from '../config/mail.js';
/**
 * This part help new person join our system.
 * We save their name, email, and password (after hiding it with hash).
 * If they are officer, we also save their phone and bike details.
 * Everything start with 'Pending' status until Admin say YES.
 */
export const register = async (req, res) => {
  const { 
    firstName, lastName, email, role, password, 
    mobileNumber, ds_division, vehicleType, vehicleNumber, languages,
    organization, employee_id, department, branch, job_title, gender, terms_accepted,
    emergency_contact
  } = req.body;
  if (!firstName || !lastName || !email || !role || !password) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }
  const emailTrimmed = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const initialStatus = 'Pending';
  // Connect to the database
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check if person is already in the book
    const userCheck = await client.query('SELECT * FROM user_table WHERE email = $1', [emailTrimmed]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User already exists.' });
    }
    // Put new person info in the database
    const newUserResult = await client.query(
      `INSERT INTO user_table (
        first_name, last_name, email, password_hash, role, status, 
        organization, employee_id, department, branch, job_title, gender, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING user_id, email, role, status`,
      [
        firstName, lastName, emailTrimmed, passwordHash, role, initialStatus,
        organization, employee_id, department, branch, job_title, gender, terms_accepted
      ]
    );
    const newUserId = newUserResult.rows[0].user_id;
    if (role === 'officer') {
        const languagesString = Array.isArray(languages) ? languages.join(', ') : languages;
        // If person is officer, save their extra details
        await client.query(
            'INSERT INTO officer_details (user_id, mobile_no, ds_division, vehicle_type, vehicle_no, languages, emergency_contact) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [newUserId, mobileNumber, ds_division, vehicleType || 'None', vehicleNumber || null, languagesString, emergency_contact]
        );
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Registration successful! Pending Admin approval.', user: newUserResult.rows[0] });
  } 
  
  catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: 'Server Error during registration.' });
  } finally {
    client.release();
  }
};
/**
 * Check if person is allowed to enter.
 * We check if email is in the system and if password matches.
 * If Admin not approved yet or Admin rejected, they cannot come in.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM user_table WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    if (user.status === 'Pending') return res.status(403).json({ message: 'Account pending admin approval.' });
    if (user.status === 'Rejected') return res.status(403).json({ message: 'Account rejected by admin.' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: { id: user.user_id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * Get list of everyone waiting for admin to say YES.
 * We get all the info for users whose status is 'Pending'.
 */
export const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.organization, 
             u.employee_id, u.department, u.branch, u.job_title, u.gender,
             o.mobile_no, o.ds_division, o.vehicle_type, o.vehicle_no, o.languages, o.emergency_contact
      FROM user_table u
      LEFT JOIN officer_details o ON u.user_id = o.user_id
      WHERE u.status = 'Pending'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * Admin say YES or NO to new person.
 * If Admin say reject, status is 'Rejected'. 
 * If Admin say okay, status is 'Active'.
 */
export const approveUser = async (req, res) => {
  const { userId, action } = req.body; 
  const status = action === 'reject' ? 'Rejected' : 'Active';
  try {
    await pool.query('UPDATE user_table SET status = $1 WHERE user_id = $2', [status, userId]);
    res.json({ message: `User ${status} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
let otpStore = {};
/**
 * Send secret code to email so person can change password.
 * Code is 4 numbers and only works for 10 minutes.
 */
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const user = await pool.query('SELECT * FROM user_table WHERE email = $1', [email.toLowerCase().trim()]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[email] = { otp, expires: Date.now() + 600000, verified: false };
    await transporter.sendMail({
      from: '"Berendina System" <noreply@berendina.org>',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}. Valid for 10 mins.`,
      html: `<b>Your OTP is ${otp}</b><p>Valid for 10 minutes.</p>`
    });
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
};
/**
 * Check if secret code from email is correct.
 * If code matches and not expired, we let them change password.
 */
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const entry = otpStore[email];
  if (entry && entry.otp === otp && entry.expires > Date.now()) {
    entry.verified = true; 
    res.json({ message: 'OTP verified! Proceed to reset password.' });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP' });
  }
};
/**
 * Replace old password with new one.
 * They must verify email code first before we allow this.
 */
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!otpStore[email] || !otpStore[email].verified) {
    return res.status(403).json({ message: 'Unauthorized. Please verify OTP first.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE user_table SET password_hash = $1 WHERE email = $2', [hash, email]);
    delete otpStore[email]; 
    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * Get list of all officers working now.
 * We only get 'Active' officers and join their details too.
 */
export const getOfficers = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id AS id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, o.mobile_no, o.ds_division, o.ds_division AS "dsDivision", o.languages, o.is_available AS "isAvailable"
      FROM user_table u
      LEFT JOIN officer_details o ON u.user_id = o.user_id
      WHERE u.role = 'officer' AND u.status = 'Active';
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * Find one specific officer using their ID.
 * We get everything about them like phone, bike, and division.
 */
export const getOfficerById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT u.user_id AS id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.employee_id, u.organization, u.department, u.branch, u.job_title, u.gender,
             o.mobile_no AS "mobileNumber", o.ds_division, o.ds_division AS "dsDivision", o.vehicle_type AS "vehicleType", o.vehicle_no AS "vehicleNumber", o.languages, o.emergency_contact, o.is_available AS "isAvailable"
      FROM user_table u
      LEFT JOIN officer_details o ON u.user_id = o.user_id
      WHERE u.user_id = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Officer not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('getOfficerById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * Change info for an officer.
 * We update user info and officer specific info at the same time.
 */
export const updateOfficer = async (req, res) => {
  const { id } = req.params;
  const { 
    firstName, lastName, 
    mobileNumber, ds_division, vehicleType, vehicleNumber, languages,
    organization, employee_id, department, branch, job_title, gender,
    emergency_contact
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query('SELECT u.*, o.* FROM user_table u LEFT JOIN officer_details o ON u.user_id = o.user_id WHERE u.user_id = $1', [id]);
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Officer not found' });
    }
    const current = currentRes.rows[0];
    await client.query(
      `UPDATE user_table SET 
        first_name = $1, last_name = $2, organization = $3, 
        employee_id = $4, department = $5, branch = $6, 
        job_title = $7, gender = $8 
      WHERE user_id = $9`,
      [
        firstName !== undefined ? firstName : current.first_name, 
        lastName !== undefined ? lastName : current.last_name, 
        organization !== undefined ? organization : current.organization, 
        employee_id !== undefined ? employee_id : current.employee_id, 
        department !== undefined ? department : current.department, 
        branch !== undefined ? branch : current.branch, 
        job_title !== undefined ? job_title : current.job_title, 
        gender !== undefined ? gender : current.gender, 
        id
      ]
    );
    const languagesString = Array.isArray(languages) ? languages.join(', ') : (languages !== undefined ? languages : current.languages);
    await client.query(
      `UPDATE officer_details SET 
        mobile_no = $1, ds_division = $2, vehicle_type = $3, 
        vehicle_no = $4, languages = $5, emergency_contact = $6 
      WHERE user_id = $7`,
      [
        mobileNumber !== undefined ? mobileNumber : current.mobile_no, 
        ds_division !== undefined ? ds_division : current.ds_division, 
        vehicleType !== undefined ? vehicleType : current.vehicle_type, 
        vehicleNumber !== undefined ? vehicleNumber : current.vehicle_no, 
        languagesString, 
        emergency_contact !== undefined ? emergency_contact : current.emergency_contact, 
        id
      ]
    );
    await client.query('COMMIT');
    res.json({ message: 'Officer updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update Officer Error:', err);
    res.status(500).json({ message: 'Server error during update' });
  } finally {
    client.release();
  }
};
/**
 * Remove an officer from the system.
 * We delete their visits, details, and user account. No turning back!
 */
export const deleteOfficer = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM field_visits WHERE officer_id = $1', [id]);
    await client.query('DELETE FROM officer_details WHERE user_id = $1', [id]);
    await client.query('DELETE FROM user_table WHERE user_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Officer deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete Officer Error:', err);
    res.status(500).json({ message: 'Server error during deletion' });
  } finally {
    client.release();
  }
};
/**
 * Change if officer is working or not.
 * If Admin makes them 'Unavailable', we send a message to the officer.
 */
export const updateOfficerAvailability = async (req, res) => {
  const { id } = req.params;
  const { isAvailable, updatedByRole } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE officer_details SET is_available = $1 WHERE user_id = $2',
      [isAvailable, id]
    );
    if (updatedByRole === 'admin' && isAvailable === false) {
      const message = "Your duty status was updated to 'Unavailable' by an Administrator.";
      await client.query(
        'INSERT INTO notification (user_id, message, sent_at, read_status) VALUES ($1, $2, NOW(), FALSE)',
        [id, message]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Availability updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update Availability Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};
/**
 * Get messages sent to a person.
 * We get the last 20 messages so they know what happened.
 */
export const getNotifications = async (req, res) => {
  const { userId } = req.query; 
  try {
    const result = await pool.query(
      'SELECT * FROM notification WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 20',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
};
