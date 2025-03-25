const express = require('express');
const { register, login, protect, restrictTo, createUser, changePassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/create-user', protect, restrictTo('admin'), createUser);
router.post('/change-password', protect, changePassword);

// Protected routes
router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
