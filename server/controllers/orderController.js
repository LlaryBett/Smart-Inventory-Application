const Order = require('../models/Order');
const Product = require('../models/Product');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    // Add metrics calculation
    const orders = await Order.find();
    const metrics = {
      totalRevenue: orders.reduce((acc, order) => 
        order.status !== 'cancelled' ? acc + order.totalAmount : acc, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'completed').length
    };

    // Handle search and filtering
    const { searchTerm, status } = req.query;
    let filteredOrders = orders;
    
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    res.json({ orders: filteredOrders, metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      status,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const order = new Order({
      customerName,
      customerEmail,
      status: status || 'pending',
      items: items || 1,
      totalAmount,
      createdAt: new Date(),
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card',
      notes: notes || ''
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findOneAndUpdate(
      { id }, // Changed from { id: id }
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findOneAndDelete({ id }); // Changed from { id: id }
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Excel import/export functionality
exports.importOrders = async (req, res) => {
  try {
    const orders = req.body;
    const savedOrders = await Order.insertMany(
      orders.map(order => ({
        ...order,
        id: order.id || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: order.createdAt || new Date().toISOString()
      }))
    );
    res.status(201).json(savedOrders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
