const Sale = require('../models/Sale');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../utils/emailService');

const getDashboardData = async (req, res) => {
  try {
    const { dateRange } = req.query;

    // Filter sales based on the date range
    let dateFilter = {};
    const now = new Date();
    if (dateRange === 'daily') {
      dateFilter = { date: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
    } else if (dateRange === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      dateFilter = { date: { $gte: startOfWeek } };
    } else if (dateRange === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
    }

    const sales = await Sale.find(dateFilter);

    // Calculate metrics
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
    const totalExpenses = sales.reduce(
      (acc, sale) =>
        acc +
        sale.products.reduce((prodAcc, product) => prodAcc + product.costPrice * product.quantity, 0),
      0
    );
    const netRevenue = totalRevenue - totalExpenses;
    const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Fetch all order statuses with proper counts
    const orders = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation result to required format
    const ordersData = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };

    // Map the aggregated counts to our ordersData object
    orders.forEach(order => {
      if (ordersData.hasOwnProperty(order._id)) {
        ordersData[order._id] = order.count;
      }
    });

    // Low stock products (quantity < 10)
    const lowStockProducts = [];
    const LOW_STOCK_THRESHOLD = 10;

    sales.forEach((sale) => {
      sale.products.forEach((product) => {
        if (product.quantity < LOW_STOCK_THRESHOLD && !product.lowStockNotified) {
          lowStockProducts.push({
            id: product.product,
            name: product.name,
            stock: product.quantity,
            category: product.category,
          });
        }
      });
    });

    // Send email alert if there are low stock products
    if (lowStockProducts.length > 0) {
      await sendLowStockAlert(lowStockProducts);

      // Update lowStockNotified flag for these products
      await Promise.all(
        sales.map(async (sale) => {
          const updatedProducts = sale.products.map((product) => ({
            ...product,
            lowStockNotified: product.quantity < LOW_STOCK_THRESHOLD ? true : product.lowStockNotified,
          }));
          await Sale.findByIdAndUpdate(sale._id, { products: updatedProducts });
        })
      );
    }

    // Recent transactions
    const transactions = sales.map((sale) => ({
      id: sale.id,
      user: sale.salesPerson,
      amount: sale.totalAmount,
    }));

    // Replace the salesData aggregation with direct mapping
    const salesData = sales.map((sale) => ({
      date: sale.date.toISOString().split('T')[0],
      amount: sale.totalAmount,
    }));

    // Prepare response
    const response = {
      salesData,
      ordersData,
      expensesData: {
        totalExpenses,
        lossPercentage: totalExpenses > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
        loss: totalExpenses,
      },
      revenueData: {
        totalRevenue,
        profitPercentage,
        profit: totalProfit,
        netRevenue,
      },
      lowStockProducts,
      transactions,
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: error.message 
    });
  }
};

module.exports = {
  getDashboardData
};

