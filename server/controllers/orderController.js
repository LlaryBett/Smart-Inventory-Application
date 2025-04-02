const Order = require('../models/Order');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    const metrics = {
      totalRevenue: orders.reduce((acc, order) => 
        order.status !== 'cancelled' ? acc + order.totalAmount : acc, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'completed').length
    };

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
    const { productId, quantity, status, ...orderData } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if there's enough inventory
    if (product.stock < quantity && status !== 'cancelled') {
      return res.status(400).json({ 
        message: `Not enough inventory for product ${product.name}. Only ${product.stock} available.` 
      });
    }

    const totalAmount = product.price * quantity;

    const order = new Order({
      ...orderData,
      productId,
      quantity,
      items: quantity,
      totalAmount,
      productName: product.name,
      pricePerUnit: product.price,
      status: status || 'pending'
    });

    console.log('Creating order with payload:', {
      quantity,
      status,
      totalAmount,
      productName: product.name
    });

    const savedOrder = await order.save();

    // Update inventory immediately for non-cancelled orders
    if (status !== 'cancelled') {
      product.stock = Math.max(0, product.stock - quantity);
      await product.save();
      console.log(`Updated product stock: ${product.name}, New stock: ${product.stock}`);
    }

    // Create a sale immediately if the order is completed
    if (status === 'completed') {
      try {
        const salesPerson = req.user?.email || 'System';
        const salesPersonId = req.user?.userId || null;
        await createSaleFromOrder(savedOrder, product, salesPerson, salesPersonId);
      } catch (saleError) {
        console.error('Failed to create sale, but order was created:', saleError);
        // Continue processing - we don't want to fail the order just because sale creation failed
      }
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findOneAndUpdate(
      { id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userName = req.user?.email || 'System';

    console.log('Updating order status:', { orderId: id, newStatus: status, userId, userName });

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    
    // No change needed if status is the same
    if (oldStatus === status) {
      return res.json(order);
    }
    
    order.status = status;

    const product = await Product.findById(order.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle inventory updates for status changes
    
    // If order is being cancelled, return products to inventory
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      product.stock += order.quantity;
      console.log(`Restored ${order.quantity} units to product ${product.name} inventory`);
      await product.save();
    }
    
    // If order was previously cancelled but now being set to active status, reduce inventory again
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      // Check if we have enough inventory
      if (product.stock < order.quantity) {
        return res.status(400).json({ 
          message: `Not enough inventory for product ${product.name}. Only ${product.stock} available.` 
        });
      }
      // Reduce the quantity from inventory
      product.stock = Math.max(0, product.stock - order.quantity);
      await product.save();
      console.log(`Reduced ${order.quantity} units from product ${product.name} inventory`);
    }

    // Create a sale when an order is marked as completed
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        await createSaleFromOrder(order, product, userName, userId);
      } catch (saleError) {
        console.error('Failed to create sale, but order status was updated:', saleError);
        // Continue processing - order status update is still valid
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findOneAndDelete({ id });
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import orders
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

// Helper function to create a sale from an order
async function createSaleFromOrder(order, product, salesPerson, salesPersonId) {
  try {
    console.log('Creating sale for completed order');
    
    const sale = new Sale({
      id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      products: [{
        product: order.productId,
        productName: order.productName,
        category: product.category || 'Uncategorized',
        quantity: order.quantity,
        unitPrice: order.pricePerUnit,
        costPrice: product.cost || 0,
        unitCost: {
          base: product.cost || 0
        }
      }],
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'credit_card',
      salesPerson: salesPerson,
      salesPersonId: salesPersonId, // This can be null if no ID provided
      notes: order.notes || '',
      date: new Date()
    });

    await sale.save();
    console.log('Sale created successfully:', sale.id);
    return sale;
  } catch (error) {
    console.error('Error creating sale from order:', error);
    throw error;
  }
}
