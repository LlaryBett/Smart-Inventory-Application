const express = require('express');
const { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductAnalytics,
  getTopProducts,
  bulkCreateProducts // Add this import
} = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getProducts);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.get('/analytics/:id', authenticate, getProductAnalytics);
router.get('/top-performing', authenticate, getTopProducts);
router.post('/bulk', authenticate, bulkCreateProducts);
router.post('/bulk-create', bulkCreateProducts);

module.exports = router;
