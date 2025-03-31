const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Product = require('../models/Product'); // Add this import at the top

// Get sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query).populate('products.product', 'name price');
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalProfit = sales.reduce((acc, sale) => acc + (sale.total - sale.cost), 0);

    res.json({
      totalRevenue,
      totalProfit,
      sales: sales.map(sale => ({
        id: sale._id,
        date: sale.date,
        total: sale.total,
        products: sale.products.map(p => ({
          name: p.product.name,
          price: p.price,
          quantity: p.quantity
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('productId', 'name');
    res.json({
      inventoryReport: inventory.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        stockLevel: item.stockLevel
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order report
exports.getOrderReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query).populate('products.product', 'name price');

    const statusCounts = {
      completed: orders.filter(order => order.status === 'completed').length,
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce((acc, order) => acc + order.total, 0);

    res.json({
      totalOrders,
      totalOrderValue,
      completed: statusCounts.completed,
      pending: statusCounts.pending,
      processing: statusCounts.processing,
      cancelled: statusCounts.cancelled,
      statusCounts,
      orders: orders.map(order => ({
        id: order._id,
        date: order.date,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        products: order.products.map(p => ({
          name: p.product.name,
          price: p.price,
          quantity: p.quantity
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user activity report
exports.getUserActivityReport = async (req, res) => {
  try {
    const users = await User.find();
    res.json({
      userActivity: users.map(user => ({
        userId: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin || 'Never'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add getAllReports function
exports.getAllReports = async (req, res) => {
  try {
    const [orders, sales, products, users] = await Promise.all([
      Order.find().sort({ createdAt: -1 }),
      Sale.find()
        .sort({ date: -1 })
        .populate({
          path: 'products.product',
          select: 'name price'
        }),
      Product.find().sort({ name: 1 }),
      User.find()
    ]);

    const salesReport = {
      totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      totalProfit: sales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
      sales: sales.map(sale => ({
        date: sale.date,
        totalAmount: sale.totalAmount || 0,
        profit: sale.profit || 0,
        productName: sale.products?.[0]?.product?.name || '',
        quantity: sale.products?.[0]?.quantity || 0
      }))
    };

    const inventoryReport = {
      inventoryReport: products.map(product => ({
        productId: product._id,
        productName: product.name,
        category: product.category,
        stockLevel: product.stock || 0,
        price: product.price || 0
      }))
    };

    const orderReport = {
      totalOrders: orders.length,
      totalOrderValue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      completed: orders.filter(order => order.status === 'completed').length,
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length,
      orders: orders.map(order => ({
        id: order._id,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount || 0,
        status: order.status
      }))
    };

    const userActivityReport = {
      userActivity: users.map(user => ({
        userId: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin || 'Never'
      }))
    };

    const recentTransactions = sales.slice(0, 10).map(sale => ({
      date: sale.date,
      customer: sale.customerName || 'Unknown Customer',
      amount: sale.totalAmount || 0,
      status: 'Completed',
      id: sale.id
    }));

    res.json({
      salesReport,
      inventoryReport,
      orderReport,
      userActivityReport,
      recentTransactions
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: error.message });
  }
};