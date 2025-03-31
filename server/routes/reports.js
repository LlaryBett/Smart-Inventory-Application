const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Protected routes (require authentication)
router.use(authenticateToken);

// Define routes
router.get('/sales', reportController.getSalesReport);
router.get('/inventory', restrictTo('admin'), reportController.getInventoryReport);
router.get('/orders', restrictTo('admin'), reportController.getOrderReport);
router.get('/user-activity', restrictTo('admin'), reportController.getUserActivityReport);
router.get('/', authenticateToken, reportController.getAllReports);

module.exports = router;