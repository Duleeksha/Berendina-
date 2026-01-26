const pool = require('../db');
const bcrypt = require('bcrypt');

// --- 1. REGISTER USER (UPDATED TO MATCH DB COLUMNS) ---
const registerUser = async (req, res) => {
  // Frontend eken ena nam (CamelCase)
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

    // Admin nam Active, Officer nam Pending
    let initialStatus = 'Pending';
    if (role === 'admin') {
        initialStatus = 'Active';
    }

    // Languages Array eka String ekak karamu
    const languagesString = languages && Array.isArray(languages) ? languages.join(', ') : null;

    // --- DATABASE QUERY (HARIMA COLUMN NAM TIKA) ---
    // mobile_no saha vehicle_no kiyana nam deka wenas kala image eke widiyata
    const newUser = await pool.query(
      `INSERT INTO user_table (
          first_name, last_name, email, password_hash, role, status, 
          mobile_no, ds_division, vehicle_type, vehicle_no, languages
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        firstName, 
        lastName, 
        email, 
        passwordHash, 
        role, 
        initialStatus,
        mobileNumber || null,   // Frontend eke 'mobileNumber' yanne DB eke 'mobile_no' ekata
        dsDivision || null,
        vehicleType || null,
        vehicleNumber || null,  // Frontend eke 'vehicleNumber' yanne DB eke 'vehicle_no' ekata
        languagesString || null
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

// --- 2. LOGIN USER ---
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    const user = userResult.rows[0];

    // Status check
    if (user.status === 'Pending') {
        return res.status(403).json({ message: 'Your account is pending Admin approval. Please contact support.' });
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

// --- 3. GET PENDING USERS ---
const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user_table WHERE status = 'Pending'");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 4. APPROVE USER ---
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

// --- EXPORTS ---
module.exports = { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser 
};