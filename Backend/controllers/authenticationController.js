import pool from '../db.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// --- EMAIL CONFIGURATION (NODEMAILER) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'duleekshabandara@gmail.com', 
    pass: 'aczi afwl ieuc pjnr'      
  }
});

// --- EXISTING FUNCTIONS (Register, Login, etc.) ---

const registerUser = async (req, res) => {
  const { 
    firstName, lastName, email, role, password, 
    mobileNumber, dsDivision, vehicleType, vehicleNumber, languages 
  } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let initialStatus = 'Pending';
    if (role === 'admin') {
        initialStatus = 'Active';
    }

    const languagesString = languages && Array.isArray(languages) ? languages.join(', ') : null;

    const newUser = await pool.query(
      `INSERT INTO user_table (
          first_name, last_name, email, password_hash, role, status, 
          mobile_no, ds_division, vehicle_type, vehicle_no, languages
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        firstName, lastName, email, passwordHash, role, initialStatus,
        mobileNumber || null, dsDivision || null,
        vehicleType || null, vehicleNumber || null, languagesString || null
      ]
    );

    res.status(201).json({ 
      message: 'Registration successful! Please wait for Admin approval.', 
      user: newUser.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    const user = userResult.rows[0];

    if (user.status === 'Pending') {
        return res.status(403).json({ message: 'Your account is pending Admin approval.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    res.json({
      message: 'Login Successful',
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user_table WHERE status = 'Pending'");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const approveUser = async (req, res) => {
    const { userId } = req.body; 
    try {
        const updateQuery = await pool.query(
            "UPDATE user_table SET status = 'Active' WHERE user_id = $1 RETURNING *",
            [userId]
        );
        if (updateQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User approved successfully", user: updateQuery.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- FORGOT PASSWORD FUNCTIONS ---

// 5. Send OTP
const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check user exists
    const userCheck = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Generate OTP (4 Digits)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 3. Set Expiry (10 Minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // 4. Update Database
    await pool.query(
      'UPDATE user_table SET reset_otp = $1, reset_otp_expires = $2 WHERE email = $3',
      [otp, expiresAt, email]
    );

    // 5. Send Email
    const mailOptions = {
      from: 'duleekshabandara@gmail.com', 
      to: email,
      subject: 'Password Reset OTP - Berendina',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent: ' + info.response);
        return res.json({ message: 'OTP sent successfully' });
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. Verify OTP (UPDATED TO FIX 400 ERROR)
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // --- DEBUG LOGS (Me tika Terminal eke balanna) ---
    console.log(`Verifying OTP for: ${email}`);
    console.log(`User Input: '${otp}'`);
    console.log(`DB Value:   '${user.reset_otp}'`);

    // Check OTP Match (Using Trim to ignore spaces)
    // String() use karanne value eka string ekak bawata sure karaganna
    if (String(user.reset_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check Expiry
    if (new Date() > new Date(user.reset_otp_expires)) {
      return res.status(400).json({ message: 'OTP Expired' });
    }

    res.json({ message: 'OTP Verified' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 7. Reset Password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    await pool.query(
      'UPDATE user_table SET password_hash = $1, reset_otp = NULL, reset_otp_expires = NULL WHERE email = $2',
      [passwordHash, email]
    );

    res.json({ message: 'Password Reset Successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser,
    sendOTP, 
    verifyOTP, 
    resetPassword 
};