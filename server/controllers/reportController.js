const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getAllReports = async (req, res) => {
  try {
    // Get orders with status counts
    const orders = await Order.find().sort({ createdAt: -1 });
    const orderStatusCounts = {
      completed: orders.filter(order => order.status === 'completed').length,
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    // Calculate order metrics
    const orderReport = {
      totalOrders: orders.length,
      totalOrderValue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      statusCounts: orderStatusCounts,
      orders: orders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
    };

    // Get sales data
    const sales = await Sale.find().sort({ date: -1 });
    const salesReport = {
      totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      totalProfit: sales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
      sales: sales.map(sale => ({
        date: sale.date,
        productName: sale.productName,
        totalAmount: sale.totalAmount,
        profit: sale.profit,
        quantity: sale.quantity
      }))
    };

    // Get all products with their stock levels
    const products = await Product.find().lean();

    // Create inventory report directly from products
    const inventoryReport = {
      inventoryReport: products.map(product => ({
        productId: product._id,
        productName: product.name,
        category: product.category,
        price: product.price,
        stockLevel: product.stock, // Use stock directly from product
        minimumStock: 10,
        location: 'Main Warehouse',
        status: product.stock <= 10 ? 'Low Stock' : 'In Stock'
      })),
      metrics: {
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock <= 10).length,
        totalValue: products.reduce((sum, product) => sum + (product.price * product.stock), 0)
      }
    };

    console.log('Generated Inventory Report:', inventoryReport);

    // Get user activity
    const users = await User.find();
    const userActivityReport = {
      userActivity: users.map(user => ({
        userId: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin || 'Never'
      }))
    };

    console.log('Generated Reports:', {
      orderReport,
      salesReport,
      inventoryReport,
      userActivityReport
    });

    res.json({
      orderReport,
      salesReport,
      inventoryReport,
      userActivityReport
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      message: 'Error generating reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
