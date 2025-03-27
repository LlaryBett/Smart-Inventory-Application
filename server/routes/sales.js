const express = require('express');
const { getSales, createSale, updateSale, deleteSale, importSales, getSaleById } = require('../controllers/saleController');
const { authenticate } = require('../middleware/authMiddleware');
const validateSale = require('../middleware/validateSale');

const router = express.Router();

// Add validation middleware to routes that need it
router.get('/', authenticate, getSales);
router.post('/', authenticate, validateSale, createSale);
router.put('/:id', authenticate, validateSale, updateSale);
router.delete('/:id', authenticate, deleteSale);
router.post('/import', authenticate, validateSale, importSales);
router.get('/:id', authenticate, getSaleById); // Add route to get a single sale by ID

module.exports = router;
