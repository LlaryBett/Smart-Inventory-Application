const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

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
    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce((acc, order) => acc + order.total, 0);

    res.json({
      totalOrders,
      totalOrderValue,
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
