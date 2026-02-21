import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser,
    sendOTP,       // NEW Import
    verifyOTP,     // NEW Import
    resetPassword,  // NEW Import
    getActiveFieldOfficers  // NEW Import
} from '../controllers/authenticationController.js';

const router = express.Router();

// Existing Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/pending-users', getPendingUsers);
router.put('/approve', approveUser);

// --- NEW FORGOT PASSWORD ROUTES ---
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

router.get('/officers', getActiveFieldOfficers);
export default router;