import express from 'express';
import { 
  register, login, getPendingUsers, approveUser, 
  sendOTP, verifyOTP, resetPassword, getOfficers, 
  getOfficerById, updateOfficer, deleteOfficer,
  updateOfficerAvailability, getNotifications
} from '../controllers/authController.js';
import { upload } from '../middleware/upload.js';
// All the roads for login and users
const router = express.Router();
// Road for new person to sign up
router.post('/register', upload.array('documents'), register);
// Road to check if person is real
router.post('/login', login);
// Get list of people waiting to join
router.get('/pending-users', getPendingUsers);
// Admin say YES to new person
router.put('/approve', approveUser);
// Send secret code to email
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/officers', getOfficers);
router.get('/officers/:id', getOfficerById);
router.put('/officers/:id', updateOfficer);
router.delete('/officers/:id', deleteOfficer);
router.put('/officers/:id/availability', updateOfficerAvailability);
router.get('/notifications', getNotifications);
export default router;
