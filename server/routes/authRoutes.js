const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Change password route - no need for protect middleware since we're using temp token
router.post('/change-password', authController.changePassword);

// Protected routes
router.post('/logout', authController.protect, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
