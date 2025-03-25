const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Protect the route with authentication
router.get('/dashboard-data', authenticateToken, getDashboardData);

module.exports = router;
