const express = require('express');
const router = express.Router();

// Controller eken hariyatama function nam import karanna oni
const { 
    registerUser, 
    loginUser, 
    getPendingUsers, 
    approveUser 
} = require('../controllers/authenticationController');

// 1. Register Route
router.post('/register', registerUser);

// 2. Login Route
router.post('/login', loginUser);

// 3. Pending Users Route (Admin Dashboard ekata)
router.get('/pending-users', getPendingUsers);

// 4. Approve Route
router.put('/approve', approveUser);

module.exports = router;