const express = require('express');
const router = express.Router();
const purchasesController = require('../controllers/purchaseController'); // Corrected path
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Protected routes (require authentication and specific roles)
router.use(authenticateToken);
router.use(restrictTo('admin', 'cashier_in', 'cashier_out')); // Allow admin and cashiers

router.get('/', purchasesController.getPurchases);
router.post('/', purchasesController.createPurchase);
router.put('/:id', purchasesController.updatePurchase);
router.delete('/:id', purchasesController.deletePurchase);

module.exports = router;
