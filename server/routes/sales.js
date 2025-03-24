const express = require('express');
const router = express.Router();
const salesController = require('../controllers/saleController');
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Protected routes (require authentication and specific roles)
router.use(authenticateToken);
router.use(restrictTo('admin', 'cashier_in', 'cashier_out')); // Allow admin and cashiers

router.get('/', salesController.getSales);
router.post('/', salesController.createSale); // Updated to match modal fields
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);
router.post('/import', salesController.importSales);

module.exports = router;
