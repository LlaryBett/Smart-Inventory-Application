import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingDown, TrendingUp, FileSpreadsheet, File as FilePdf, FileJson } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [dateRange, setDateRange] = useState('7d');
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [orderReport, setOrderReport] = useState(null);
  const [userActivityReport, setUserActivityReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        // Fetch Sales Report
        const salesResponse = await fetch('http://localhost:5000/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!salesResponse.ok) throw new Error('Failed to fetch reports');
        const allReportsData = await salesResponse.json();
        setSalesReport(allReportsData.salesReport);
        setInventoryReport(allReportsData.inventoryReport);
        setOrderReport(allReportsData.orderReport);
        setUserActivityReport(allReportsData.userActivityReport);

      } catch (error) {
        toast.error('Failed to fetch reports data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [dateRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportToExcel = () => {
    try {
      const wb = utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Revenue', salesReport?.totalRevenue || 0],
        ['Profit', salesReport?.totalProfit || 0],
        ['Total Orders', orderReport?.totalOrders || 0],
        ['Total Order Value', orderReport?.totalOrderValue || 0]
      ];
      const summaryWs = utils.aoa_to_sheet(summaryData);
      utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Sales Sheet
      if (salesReport?.sales?.length) {
        const salesWs = utils.json_to_sheet(salesReport.sales);
        utils.book_append_sheet(wb, salesWs, 'Sales');
      }

      // Orders Sheet
      if (orderReport?.orders?.length) {
        const ordersWs = utils.json_to_sheet(orderReport.orders);
        utils.book_append_sheet(wb, ordersWs, 'Orders');
      }

      // Inventory Sheet
      if (inventoryReport?.inventoryReport?.length) {
        const inventoryWs = utils.json_to_sheet(inventoryReport.inventoryReport);
        utils.book_append_sheet(wb, inventoryWs, 'Inventory');
      }

      // User Activity Sheet
      if (userActivityReport?.userActivity?.length) {
        const userActivityWs = utils.json_to_sheet(userActivityReport.userActivity);
        utils.book_append_sheet(wb, userActivityWs, 'User Activity');
      }

      writeFile(wb, `business-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export Excel report');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Business Report', 14, yPos);
      yPos += 15;

      // Summary Section
      doc.setFontSize(16);
      doc.text('Summary', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', `$${salesReport?.totalRevenue?.toLocaleString() || 0}`],
          ['Total Profit', `$${salesReport?.totalProfit?.toLocaleString() || 0}`],
          ['Total Orders', orderReport?.totalOrders?.toString() || '0'],
          ['Total Order Value', `$${orderReport?.totalOrderValue?.toLocaleString() || 0}`]
        ],
        theme: 'grid'
      });

      yPos = doc.autoTable.previous.finalY + 15;

      // Orders Section
      if (orderReport?.orders?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Recent Orders', 14, 20);
        
        doc.autoTable({
          startY: 30,
          head: [['Date', 'Customer', 'Amount', 'Status']],
          body: orderReport.orders.map((order) => [
            order.createdAt,
            order.customerName,
            `$${order.totalAmount.toLocaleString()}`,
            order.status
          ]),
          theme: 'grid'
        });
      }

      // Inventory Section
      if (inventoryReport?.inventoryReport?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Inventory Status', 14, 20);
        
        doc.autoTable({
          startY: 30,
          head: [['Product ID', 'Stock Level']],
          body: inventoryReport.inventoryReport.map((item) => [
            item.productId,
            item.stockLevel
          ]),
          theme: 'grid'
        });
      }

      // User Activity Section
      if (userActivityReport?.userActivity?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('User Activity', 14, 20);
        
        doc.autoTable({
          startY: 30,
          head: [['User ID', 'Name', 'Email', 'Last Login']],
          body: userActivityReport.userActivity.map((user) => [
            user.userId,
            user.name,
            user.email,
            user.lastLogin
          ]),
          theme: 'grid'
        });
      }

      doc.save(`business-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report downloaded successfully');
    } catch {
      toast.error('Failed to export PDF report');
    }
  };

  const exportToJSON = () => {
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        salesReport: salesReport || {},
        inventoryReport: inventoryReport || {},
        orderReport: orderReport || {},
        userActivityReport: userActivityReport || {}
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const fileName = `business-report-${new Date().toISOString().split('T')[0]}.json`;

      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('JSON report downloaded successfully');
    } catch {
      toast.error('Failed to export JSON report');
    }
  };

  // Prepare inventory chart data
  const inventoryChartData = inventoryReport?.inventoryReport?.map((item) => ({
    name: item.productId,
    stockLevel: item.stockLevel,
  })) || [];

   // Prepare orders chart data
   const ordersChartData = [
    { name: 'Completed', value: orderReport?.totalOrders || 0 },
    { name: 'Pending', value: 0 },
    { name: 'Cancelled', value: 0 },
  ];

  // Prepare sales chart data
  const salesChartData = salesReport?.sales?.map((sale) => ({
    name: sale.productName,
    amount: sale.totalAmount,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
            <div className="flex space-x-4">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <div className="flex space-x-2">
                <button 
                  onClick={exportToExcel} 
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <FilePdf className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button 
                  onClick={exportToJSON} 
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <FileJson className="h-4 w-4 mr-1" />
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-semibold text-gray-900">ksh {salesReport?.totalRevenue?.toLocaleString() || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-semibold text-gray-900">{orderReport?.totalOrders || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Profit</dt>
                    <dd className="text-lg font-semibold text-green-600">ksh {salesReport?.totalProfit?.toLocaleString() || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Order Value</dt>
                    <dd className="text-lg font-semibold text-gray-900">ksh {orderReport?.totalOrderValue?.toLocaleString() || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue & Profit Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Profit Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesReport?.sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Donut Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {ordersChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Top Products */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesReport?.sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalAmount" name="Revenue" fill="#8884d8" />
                <Bar dataKey="quantity" name="Sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" name="Sales Amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory - Donut Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventoryChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="stockLevel"
                nameKey="name"
                label={({ name, value }) => `${name} (${value})`}
              >
                {inventoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

         {/* Recent Transactions */}
         <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderReport?.orders?.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ksh {transaction.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userActivityReport?.userActivity?.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;