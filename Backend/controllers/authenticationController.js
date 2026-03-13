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

// ... existing imports ...

const registerUser = async (req, res) => {
  const { 
    firstName, lastName, email, role, password, 
    mobileNumber, dsDivision, vehicleType, vehicleNumber, languages 
  } = req.body;

  // --- UPDATED: Backend Validations ---
  if (!firstName || !lastName || !email || !role || !password) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Duplicate Email Check
    const userCheck = await client.query('SELECT * FROM user_table WHERE email = $1', [emailTrimmed]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    // 3. Password Hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const initialStatus = 'Pending';

    // 4. INSERT INTO user_table
    const newUserQuery = `
      INSERT INTO user_table (first_name, last_name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, first_name, last_name, email, role, status
    `;
    
    const newUserResult = await client.query(newUserQuery, [
      firstName, lastName, emailTrimmed, passwordHash, role, initialStatus
    ]);
    
    const newUserId = newUserResult.rows[0].user_id;

    // 5. IF OFFICER: Insert into officer_details
    if (role === 'officer') {
        const languagesString = Array.isArray(languages) ? languages.join(', ') : languages;
        
        const officerQuery = `
            INSERT INTO officer_details (user_id, mobile_no, ds_division, vehicle_type, vehicle_no, languages)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(officerQuery, [
            newUserId, 
            mobileNumber, 
            dsDivision, 
            vehicleType || 'None', 
            vehicleNumber || null, 
            languagesString
        ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Registration successful! Please wait for Admin approval.', 
      user: newUserResult.rows[0] 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: 'Server Error during registration.' });
  } finally {
    client.release();
  }
};

// ... keep all other functions as they are ...


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // --- UPDATED: Backend Validations ---
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const emailTrimmed = email.trim();

  try {
    // 1. User check (Using trimmed email)
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [emailTrimmed]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    const user = userResult.rows[0];

    // 2. Status Check
    if (user.status === 'Pending') {
        return res.status(403).json({ message: 'Your account is pending Admin approval.' });
    }

    // 3. Password Check
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    // 4. Officer Info Fetching
    let officerInfo = {};
    if (user.role === 'officer') {
        const officerRes = await pool.query('SELECT * FROM officer_details WHERE user_id = $1', [user.user_id]);
        if (officerRes.rows.length > 0) {
            officerInfo = officerRes.rows[0];
        }
    }

    // 5. Success Response
    res.json({
      message: 'Login Successful',
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...officerInfo 
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ... keep all other functions (registerUser, sendOTP, etc.) as they are ...

const getPendingUsers = async (req, res) => {
  try {
    // user_table එක සහ officer_details එක JOIN කරලා Data ගන්නවා
    // LEFT JOIN දැම්මම, Officer කෙනෙක් නෙවෙයි නම් (Admin වගේ), අර අමතර විස්තර NULL විදිහට හරි එනවා (Error එන්නේ නෑ)
    
    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.status,
        o.mobile_no,
        o.ds_division,
        o.vehicle_type,
        o.vehicle_no,
        o.languages
      FROM user_table u
      LEFT JOIN officer_details o ON u.user_id = o.user_id
      WHERE u.status = 'Pending'
    `;

    const result = await pool.query(query);
    
    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const approveUser = async (req, res) => {
    const { userId } = req.body; 
    
    try {
        // 1. user_table එකේ Status එක 'Active' කියලා Update කරනවා
        const updateQuery = await pool.query(
            "UPDATE user_table SET status = 'Active' WHERE user_id = $1 RETURNING *",
            [userId]
        );

        if (updateQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = updateQuery.rows[0];

        // 2. අලුත් ක්‍රමය: එයා Officer කෙනෙක් නම්, අපි officer_details ටිකත් අරගෙන Response එකට එකතු කරනවා.
        // (එතකොට Frontend එකේ ලිස්ට් එක Update වෙද්දී ඔක්කොම විස්තර පේනවා)
        let officerInfo = {};
        
        if (updatedUser.role === 'officer') {
            const officerRes = await pool.query('SELECT * FROM officer_details WHERE user_id = $1', [userId]);
            if (officerRes.rows.length > 0) {
                officerInfo = officerRes.rows[0];
            }
        }

        res.json({ 
            message: "User approved successfully", 
            user: { 
                ...updatedUser, 
                ...officerInfo // User table + Officer details එකතු කරලා යවනවා
            } 
        });

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
    // 1. User කෙනෙක් ඉන්නවද කියලා බලනවා (user_table එකෙන්)
    const userCheck = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. OTP එක Generate කරනවා (අංක 4ක්)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 3. Expiry Time එක හදනවා (විනාඩි 10ක්)
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // 4. Database එක Update කරනවා
    // වැදගත්: ඔයාගේ screenshot එකේ Column නම තිබුනේ 'reset_otp_expire' කියලා.
    // ඒ නිසා SQL එකේ නම වෙනස් කළා.
    await pool.query(
      'UPDATE user_table SET reset_otp = $1, reset_otp_expire = $2 WHERE email = $3',
      [otp, expiresAt, email]
    );

    // 5. Email එක යවනවා
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
// 6. Verify OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // 1. user_table එකෙන් Data ගන්නවා (OTP තියෙන්නේ මෙතන)
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // --- DEBUG LOGS ---
    // console.log(`Verifying OTP for: ${email}`);
    // console.log(`User Input: '${otp}'`);
    // console.log(`DB Value:   '${user.reset_otp}'`);

    // 2. OTP Match වෙනවද බලනවා
    if (String(user.reset_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // 3. Expiry Check කරනවා
    // වැදගත්: ඔයාගේ DB Screenshot එකට අනුව Column නම 'reset_otp_expire' (singular) විය යුතුයි.
    if (new Date() > new Date(user.reset_otp_expire)) {
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
    // 1. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 2. Update password and clear OTP
    // වැදගත්: ඔයාගේ DB Screenshot එකට අනුව Column නම 'reset_otp_expire' (singular) විය යුතුයි.
    await pool.query(
      'UPDATE user_table SET password_hash = $1, reset_otp = NULL, reset_otp_expire = NULL WHERE email = $2',
      [passwordHash, email]
    );

    res.json({ message: 'Password Reset Successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- NEW: Field Officers Data Fetching ---
const getActiveFieldOfficers = async (req, res) => {
  try {
    // METHANA QUERY EKA WENAS KALA (Aluth columns 3k ekathu kala)
    const query = `
      SELECT 
        u.user_id AS id, 
        u.first_name AS "firstName", 
        u.last_name AS "lastName", 
        u.email, 
        o.mobile_no AS mobile, 
        o.ds_division AS district, 
        o.vehicle_type AS "vehicleType", 
        o.vehicle_no AS "vehicleNo", 
        o.languages,
        u.status 
      FROM user_table u
      JOIN officer_details o ON u.user_id = o.user_id
      WHERE u.role = 'officer' AND u.status = 'Active';
    `;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching active field officers:', error);
    res.status(500).json({ message: 'Server error while fetching officers' });
  }
};

// --- NEW: Projects Data Fetching ---
const getProjects = async (req, res) => {
  try {
    // API eken ewana data tika UI eke (Dummy data) nam walatama galapenna AS dala gannawa
    const query = `
      SELECT 
        project_id AS id, 
        project_name AS name, 
        donor_agency AS donor, 
        target_location AS location, 
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start, 
        TO_CHAR(end_date, 'YYYY-MM-DD') AS "end", 
        budget, 
        status 
      FROM project
      ORDER BY project_id DESC;
    `;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

// --- NEW: Add New Project ---
const addProject = async (req, res) => {
  const { projectName, donorAgency, targetLocation, startDate, endDate, budget, status, description } = req.body;
  
  try {
    const query = `
      INSERT INTO project (project_name, donor_agency, target_location, start_date, end_date, budget, status, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    // Values tika array ekakata danawa (Empty fields thiyenawanam NULL widihata yanawa)
    const values = [
      projectName, 
      donorAgency || null, 
      targetLocation || null, 
      startDate, 
      endDate || null, 
      budget ? parseFloat(budget) : null, 
      status || 'Active', 
      description || null
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({ 
      message: 'Project added successfully!', 
      project: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error adding new project:', error);
    res.status(500).json({ message: 'Server error while adding the project' });
  }
};

// --- NEW: Get All Beneficiaries ---


const getBeneficiaries = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.beneficiary_id AS id, 
        b.ben_name AS name, 
        b.ben_contac_no AS contact, 
        b.ben_project AS project, -- FIXED: Column eka 'project' kiyala map kala
        b.ben_status AS status, 
        COALESCE(b.ben_progress, 0) AS progress,
        b.ben_nic AS nic,
        b.ben_dob AS dob,
        b.ben_gender AS gender,
        b.ben_address AS address,
        b.ben_district AS district,
        b.ben_ds_division AS "dsDivision",
        b.ben_marital_status AS "maritalStatus",
        b.ben_family_members AS "familyMembers",
        b.ben_monthly_income AS "monthlyIncome",
        b.ben_occupation AS occupation
      FROM beneficiary b
      ORDER BY b.beneficiary_id DESC;
    `;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({ message: 'Server error while fetching beneficiaries' });
  }
};



const addBeneficiary = async (req, res) => {
  const { 
    name, nic, dob, gender, address, contact, district, 
    dsDivision, maritalStatus, familyMembers, monthlyIncome, 
    occupation, project, status 
  } = req.body;

  try {
    const query = `
      INSERT INTO beneficiary (
        ben_name, ben_nic, ben_dob, ben_gender, ben_address, 
        ben_contac_no, ben_district, ben_ds_division, ben_marital_status, 
        ben_family_members, ben_monthly_income, ben_occupation, 
        ben_project, ben_status, ben_progress
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      name, nic, dob || null, gender, address, contact, district, 
      dsDivision, maritalStatus, parseInt(familyMembers) || 0, 
      parseFloat(monthlyIncome) || 0, occupation, 
      project, 
      status || 'active', 
      0 
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Beneficiary added successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding beneficiary:', error);
    res.status(500).json({ message: 'Server error while adding beneficiary' });
  }
};

const updateBeneficiary = async (req, res) => {
  const { id } = req.params;
  const { 
    name, nic, dob, gender, address, contact, district, 
    dsDivision, maritalStatus, familyMembers, monthlyIncome, 
    occupation, project, status 
  } = req.body;

  try {
    const query = `
      UPDATE beneficiary SET 
        ben_name = $1, ben_nic = $2, ben_dob = $3, ben_gender = $4, ben_address = $5, 
        ben_contac_no = $6, ben_district = $7, ben_ds_division = $8, ben_marital_status = $9, 
        ben_family_members = $10, ben_monthly_income = $11, ben_occupation = $12, 
        ben_project = $13, ben_status = $14
      WHERE beneficiary_id = $15
      RETURNING *;
    `;
    
    const values = [
      name, nic, dob || null, gender, address, contact, district, 
      dsDivision, maritalStatus, parseInt(familyMembers) || 0, 
      parseFloat(monthlyIncome) || 0, occupation, 
      project, status, id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Beneficiary not found" });
    }

    res.json({ message: "Beneficiary updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error during beneficiary update" });
  }
};

// --- NEW: Get All Field Visits ---
const getFieldVisits = async (req, res) => {
  try {
    const query = `
      SELECT 
        v.visit_id AS id, 
        v.beneficiary_name AS beneficiary, 
        v.district, 
        TO_CHAR(v.visit_date, 'YYYY-MM-DD') AS date, 
        TO_CHAR(v.visit_time, 'HH12:MI AM') AS time, 
        v.status,
        u.first_name || ' ' || u.last_name AS "officerName"
      FROM field_visits v
      LEFT JOIN user_table u ON v.officer_id = u.user_id
      ORDER BY v.visit_date ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching field visits:', error);
    res.status(500).json({ message: 'Server error while fetching visits' });
  }
};

// --- NEW: Add Field Visit ---
const addFieldVisit = async (req, res) => {
  const { beneficiary, district, date, time, officerId, status } = req.body;
  try {
    const query = `
      INSERT INTO field_visits (beneficiary_name, district, visit_date, visit_time, officer_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [beneficiary, district, date, time, officerId, status || 'scheduled'];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Visit scheduled successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error scheduling visit:', error);
    res.status(500).json({ message: 'Server error while scheduling' });
  }
};

// Export ekata me aluth functions deka danna (existing list ekatama)
const getDashboardStats = async (req, res) => {
  try {
    // Database eken total count eka gannawa
    const result = await pool.query('SELECT COUNT(*) FROM beneficiary');
    
    // SQL result eke 'count' kiyana value eka number ekak widihata gannawa
    const totalCount = parseInt(result.rows[0].count);

    res.status(200).json({
      totalBeneficiaries: totalCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
};

export { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser,
    sendOTP, 
    verifyOTP, 
    resetPassword,
    getActiveFieldOfficers,
    getProjects,
    addProject,
    getBeneficiaries,
    addBeneficiary,
    updateBeneficiary,
    getFieldVisits,
    addFieldVisit,
    getDashboardStats
};