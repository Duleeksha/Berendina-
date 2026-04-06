import express from 'express';
import { 
  register, login, getPendingUsers, approveUser, 
  sendOTP, verifyOTP, resetPassword, getOfficers, 
  getOfficerById, updateOfficer, deleteOfficer 
} from '../controllers/authController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', upload.array('documents'), register);
router.post('/login', login);
router.get('/pending-users', getPendingUsers);
router.put('/approve', approveUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/officers', getOfficers);
router.get('/officers/:id', getOfficerById);
router.put('/officers/:id', updateOfficer);
router.delete('/officers/:id', deleteOfficer);

export default router;
