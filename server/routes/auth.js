const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../controllers/authController');
const { requirePermission } = require('../middleware/permissions');
const emailService = require('../services/emailService');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/users', protect, requirePermission('manageUsers'), authController.createUser);
router.post('/change-password', protect, authController.changePassword);

// Test email route
router.post('/test-email', async (req, res) => {
  try {
    const testUser = {
      name: req.body.name || 'Test User',
      email: req.body.email || 'llarykiplangat@gmail.com',
      role: req.body.role || 'admin'
    };
    
    const testPassword = 'Test123Password';
    
    await emailService.sendWelcomeEmail(testUser, testPassword);
    res.json({ 
      message: 'Test email sent successfully',
      sentTo: testUser.email
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to send email',
      error: error.message,
      details: error.response?.text 
    });
  }
});

module.exports = router;
