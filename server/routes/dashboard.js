const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Protect the route with authentication
router.use(authenticateToken);

// Analytics route
router.get('/data', getDashboardData);

module.exports = router;
