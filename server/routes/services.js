const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController'); // Corrected path
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Public route: Fetch all services (no authentication required)
router.get('/', serviceController.getServices);

// Protected routes: Require authentication and specific roles
router.use(authenticateToken);
router.use(restrictTo('admin', 'cashier_in', 'cashier_out')); // Allow admin and cashiers

router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;
