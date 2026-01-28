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
    // Officer Specific Fields (මේවා Frontend එකෙන් එවන නම්)
    mobileNumber, dsDivision, vehicleType, vehicleNumber, languages 
  } = req.body;

  // 1. Password Validation
  if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  // Transaction එකක් පටන් ගන්න client කෙනෙක් ගන්නවා (Table දෙකකට දාන්න ඕන නිසා)
  const client = await pool.connect();

  try {
    // Transaction START
    await client.query('BEGIN');

    // 2. Email එක කලින් තියෙනවද බලනවා
    // (වැදගත්: මෙතන pool.query නෙවෙයි client.query පාවිච්චි කරන්න ඕනේ Transaction එක ඇතුලේ නිසා)
    const userCheck = await client.query('SELECT * FROM user_table WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK'); // Transaction එක නවත්වනවා (අවලංගු කරනවා)
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 3. Password Hash කරනවා
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let initialStatus = 'Pending';
    if (role === 'admin') {
       initialStatus = 'Pending'; // Admin ලාටත් Approve වෙන්න ඕන
    }

    // 4. INSERT INTO user_table (පොදු විස්තර ටික)
    // දැන් මෙතනට mobile_no, ds_division වගේ ඒවා දාන්නේ නෑ, ඒවා යන්නේ අනිත් table එකට
    const newUserQuery = `
      INSERT INTO user_table (first_name, last_name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, first_name, last_name, email, role, status
    `;
    
    const newUserResult = await client.query(newUserQuery, [
      firstName, lastName, email, passwordHash, role, initialStatus
    ]);
    
    // අලුත් User ගේ ID එක ලබා ගැනීම
    const newUserId = newUserResult.rows[0].user_id;

    // 5. IF OFFICER: Insert into officer_details (Officer විස්තර ටික)
    if (role === 'officer') {
        // Languages array එක String එකක් බවට පත් කරනවා (උදා: ["Sinhala", "Tamil"] -> "Sinhala, Tamil")
        const languagesString = languages && Array.isArray(languages) ? languages.join(', ') : languages;
        
        const officerQuery = `
            INSERT INTO officer_details (user_id, mobile_no, ds_division, vehicle_type, vehicle_no, languages)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(officerQuery, [
            newUserId,          // උඩින් ලැබුණු user_id එක Foreign Key එකක් විදිහට
            mobileNumber, 
            dsDivision, 
            vehicleType || 'None', 
            vehicleNumber || null, 
            languagesString
        ]);
    }

    // 6. Transaction COMMIT (සාර්ථකයි නම් Save කරනවා)
    await client.query('COMMIT');

    res.status(201).json({ 
      message: 'Registration successful! Please wait for Admin approval.', 
      user: newUserResult.rows[0] 
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Error එකක් ආවොත් ඔක්කොම අවලංගු කරනවා
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  } finally {
    client.release(); // Connection එක නිදහස් කරනවා
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, password: password ? '***' : undefined });

  try {
    // 1. මුලින්ම user_table එකෙන් මූලික විස්තර ගන්නවා
    const userResult = await pool.query('SELECT * FROM user_table WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    const user = userResult.rows[0];

    // 2. Status Check (Admin Approve කරලා නැත්නම් Login වෙන්න බෑ)
    if (user.status === 'Pending') {
        console.log('User pending approval:', email);
        return res.status(403).json({ message: 'Your account is pending Admin approval.' });
    }

    // 3. Password Check
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Invalid password for email:', email);
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    // 4. Officer කෙනෙක් නම්, අපි officer_details table එකෙන් අමතර විස්තර ගන්නවා
    let officerInfo = {};
    
    if (user.role === 'officer') {
        // user_id එක පාවිච්චි කරලා officer_details එකෙන් හොයනවා
        const officerRes = await pool.query('SELECT * FROM officer_details WHERE user_id = $1', [user.user_id]);
        
        if (officerRes.rows.length > 0) {
            officerInfo = officerRes.rows[0];
            // officerInfo එකේ තියෙන officer_id එක සහ user_id එක Frontend එකට ඕන නැත්නම් අයින් කරන්න පුළුවන්, 
            // හැබැයි දැනට ඔක්කොම යවමු.
        }
    }

    console.log('Login successful for:', email);
    
    // 5. Response එක යවනවා
   res.json({
      message: 'Login Successful',
      
      user: {
        // User Table Data
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
         
        // Officer Details (Spread Operator එකෙන් එකතු කරනවා)
        // Officer කෙනෙක් නෙවෙයි නම් මේක හිස්ව (Empty) තියෙයි.
        ...officerInfo 
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

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

export { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser,
    sendOTP, 
    verifyOTP, 
    resetPassword 
};