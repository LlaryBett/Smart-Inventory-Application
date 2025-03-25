const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Remove the catch-all authentication since we're doing it per route
// router.use(authenticateToken);

// Product routes with individual authentication
router.get('/', authenticateToken, productController.getProducts);
router.post('/', authenticateToken, productController.createProduct);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;
