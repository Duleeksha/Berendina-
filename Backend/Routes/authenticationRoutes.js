const express = require('express');
const router = express.Router();

const { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser,
    sendOTP,       // NEW Import
    verifyOTP,     // NEW Import
    resetPassword  // NEW Import
} = require('../controllers/authenticationController');

// Existing Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/pending-users', getPendingUsers);
router.put('/approve', approveUser);

// --- NEW FORGOT PASSWORD ROUTES ---
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;