const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Protected routes (require authentication and admin role)
router.use(authenticateToken);
router.use(restrictTo('admin')); // Only admins can access these routes

router.get('/', settingsController.getSettings); // Get all settings grouped by category
router.post('/', settingsController.saveSettings); // Save grouped settings
router.delete('/:category/:key', settingsController.deleteSetting); // Delete a specific setting

module.exports = router;
