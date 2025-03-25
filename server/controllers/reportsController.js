const Sale = require('../models/Sale');
const User = require('../models/User');

exports.getReports = async (req, res) => {
  try {
    const { dateRange } = req.query;

    // Filter sales based on the date range
    let dateFilter = {};
    const now = new Date();
    if (dateRange === '7d') {
      dateFilter = { date: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
    } else if (dateRange === '30d') {
      dateFilter = { date: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
    } else if (dateRange === '90d') {
      dateFilter = { date: { $gte: new Date(now.setDate(now.getDate() - 90)) } };
    }

    // Fetch sales data
    const sales = await Sale.find(dateFilter);

    // Calculate sales metrics
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
    const salesData = sales.map((sale) => ({
      date: sale.date.toISOString().split('T')[0],
      totalAmount: sale.totalAmount,
      profit: sale.profit,
      productName: sale.products.map((p) => p.name).join(', '),
      quantity: sale.products.reduce((acc, p) => acc + p.quantity, 0),
    }));

    // Fetch inventory data
    const inventoryReport = sales.flatMap((sale) =>
      sale.products.map((product) => ({
        productId: product.product,
        stockLevel: product.quantity,
      }))
    );

    // Fetch order data
    const totalOrders = sales.length;
    const totalOrderValue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const orders = sales.map((sale) => ({
      id: sale.id,
      createdAt: sale.date.toISOString(),
      customerName: sale.customer,
      totalAmount: sale.totalAmount,
      status: 'completed', // Assuming all orders are completed
    }));

    // Fetch user activity data
    const users = await User.find();
    const userActivity = users.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : 'Never',
    }));

    // Prepare response
    const response = {
      salesReport: {
        totalRevenue,
        totalProfit,
        sales: salesData,
      },
      inventoryReport: {
        inventoryReport,
      },
      orderReport: {
        totalOrders,
        totalOrderValue,
        orders,
      },
      userActivityReport: {
        userActivity,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
};
