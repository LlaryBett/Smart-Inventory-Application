const Sale = require('../models/Sale');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../utils/emailService');

const getDashboardData = async (req, res) => {
  try {
    // Log incoming request
    console.log('Dashboard request received:', {
      dateRange: req.query.dateRange,
      headers: req.headers
    });

    const { dateRange } = req.query;

    // Fix: Modify date filter to handle future dates and use $lte instead of $gte
    let dateFilter = {};
    const now = new Date();
    if (dateRange === 'daily') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { 
        date: { 
          $gte: startOfDay,
          $lte: now 
        } 
      };
    } else if (dateRange === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { 
        date: { 
          $gte: startOfWeek,
          $lte: now 
        } 
      };
    } else if (dateRange === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { 
        date: { 
          $gte: startOfMonth,
          $lte: now 
        } 
      };
    } else {
      // If no dateRange is specified, get all data
      dateFilter = {};
    }

    // Debug: Log the date filter
    console.log('Date filter:', dateFilter);

    // Fetch sales with proper date filter and populated data
    const sales = await Sale.find(dateFilter)
      .populate({
        path: 'products.product',
        select: 'name price'
      })
      .lean();

    // Debug: Log the found sales
    console.log('Found sales:', sales.length);

    // Calculate metrics
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0), 0);
    const totalExpenses = sales.reduce(
      (acc, sale) => acc + sale.products.reduce((prodAcc, product) => 
        prodAcc + ((product.costPrice || 0) * (product.quantity || 0)), 0), 0);
    const netRevenue = totalRevenue - totalExpenses;
    const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const ordersData = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };

    orderStats.forEach(stat => {
      if (ordersData.hasOwnProperty(stat._id)) {
        ordersData[stat._id] = stat.count;
      }
    });

    // Process low stock products and send alerts
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockProducts = await Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } }, 'name stock category price').lean();

    // Send email alerts for low stock products
    if (lowStockProducts.length > 0) {
      console.log('Sending low stock alerts for:', lowStockProducts.length, 'products');
      
      try {
        await sendLowStockAlert({
          products: lowStockProducts,
          threshold: LOW_STOCK_THRESHOLD
        });
        console.log('Low stock alerts sent successfully');
      } catch (emailError) {
        console.error('Failed to send low stock alerts:', emailError);
      }
    }

    // Format transactions
    const transactions = sales.slice(-10).map(sale => ({
      id: sale._id,
      user: sale.salesPerson,
      customer: sale.customerName || 'Unknown',
      amount: sale.totalAmount || 0,
      date: sale.date,
      status: 'Completed'
    }));

    // Log the transactions before sending
    console.log('Transactions before response:', transactions);

    // Format sales data with proper date grouping
    const salesData = sales.map(sale => ({
      date: new Date(sale.date).toISOString().split('T')[0],
      amount: sale.totalAmount || 0,
      profit: sale.profit || 0,
      productName: sale.products[0]?.product?.name || 'Unknown Product'
    }));

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
      transactions
    };

    // Add debug logs
    console.log('Sales count:', sales.length);
    console.log('Transactions count:', transactions.length);
    console.log('Date filter used:', JSON.stringify(dateFilter));

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

