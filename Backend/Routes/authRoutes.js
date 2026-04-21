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
// check if secret code is correct
router.post('/verify-otp', verifyOTP);
// put new password
router.post('/reset-password', resetPassword);
// get list of all officers
router.get('/officers', getOfficers);
// get info for one officer
router.get('/officers/:id', getOfficerById);
// change officer info
router.put('/officers/:id', updateOfficer);
// remove officer from system
router.delete('/officers/:id', deleteOfficer);
// change if officer is working or not
router.put('/officers/:id/availability', updateOfficerAvailability);
// get messages for person
router.get('/notifications', getNotifications);
export default router;
