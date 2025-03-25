const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportController');
const { authenticateToken, restrictTo } = require('../middleware/permissions');
const { getReports } = require('../controllers/reportsController');

// Protected routes (require authentication)
router.use(authenticateToken);

// Define routes
router.get('/sales', reportsController.getSalesReport);
router.get('/inventory', restrictTo('admin'), reportsController.getInventoryReport);
router.get('/orders', restrictTo('admin'), reportsController.getOrderReport);
router.get('/user-activity', restrictTo('admin'), reportsController.getUserActivityReport);
router.get('/', authenticateToken, getReports);

module.exports = router;
