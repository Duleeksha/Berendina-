import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import transporter from '../config/mail.js';

// --- AUTHENTICATION & USER MANAGEMENT ---

export const register = async (req, res) => {
  const { 
    firstName, lastName, email, role, password, 
    mobileNumber, dsDivision, vehicleType, vehicleNumber, languages 
  } = req.body;

  if (!firstName || !lastName || !email || !role || !password) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const initialStatus = 'Pending';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userCheck = await client.query('SELECT * FROM user_table WHERE email = $1', [emailTrimmed]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User already exists.' });
    }

    const newUserResult = await client.query(
      'INSERT INTO user_table (first_name, last_name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, email, role, status',
      [firstName, lastName, emailTrimmed, passwordHash, role, initialStatus]
    );
    
    const newUserId = newUserResult.rows[0].user_id;

    if (role === 'officer') {
        const languagesString = Array.isArray(languages) ? languages.join(', ') : languages;
        await client.query(
            'INSERT INTO officer_details (user_id, mobile_no, ds_division, vehicle_type, vehicle_no, languages) VALUES ($1, $2, $3, $4, $5, $6)',
            [newUserId, mobileNumber, dsDivision, vehicleType || 'None', vehicleNumber || null, languagesString]
        );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Registration successful! Pending Admin approval.', user: newUserResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: 'Server Error during registration.' });
  } finally {
    client.release();
  }
};

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

    res.json({ message: 'Login successful', user: { id: user.user_id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, first_name, last_name, email, role FROM user_table WHERE status = 'Pending'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

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

// --- OTP & PASSWORD RESET ---

let otpStore = {};

export const sendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[email] = { otp, expires: Date.now() + 600000 };

  try {
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
    res.status(500).json({ message: 'Error sending email' });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const entry = otpStore[email];
  if (entry && entry.otp === otp && entry.expires > Date.now()) {
    res.json({ message: 'OTP verified!' });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE user_table SET password_hash = $1 WHERE email = $2', [hash, email]);
    delete otpStore[email];
    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOfficers = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id AS id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, o.mobile_no, o.ds_division, o.languages
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
