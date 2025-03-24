const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get all orders
router.get('/', orderController.getOrders);

// Get a single order by ID
router.get('/:id', orderController.getOrderById);

// Create a new order
router.post('/', orderController.createOrder);

// Update an order
router.put('/:id', orderController.updateOrder);

// Delete an order
router.delete('/:id', orderController.deleteOrder);

// Add import route
router.post('/import', orderController.importOrders);

// Add Excel export route
router.get('/export', orderController.getOrders); // Use same getOrders for export

module.exports = router;
