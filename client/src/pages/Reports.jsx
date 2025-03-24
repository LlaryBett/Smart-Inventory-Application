import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingDown, TrendingUp, Download, Calendar, Filter, FileSpreadsheet, File as FilePdf, FileJson } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reports = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [category, setCategory] = useState('all');
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
        const salesResponse = await fetch('http://localhost:5000/api/reports/sales', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!salesResponse.ok) throw new Error('Failed to fetch sales report');
        const salesData = await salesResponse.json();
        setSalesReport(salesData);

        // Fetch Inventory Report
        const inventoryResponse = await fetch('http://localhost:5000/api/reports/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory report');
        const inventoryData = await inventoryResponse.json();
        setInventoryReport(inventoryData);

        // Fetch Order Report
        const orderResponse = await fetch('http://localhost:5000/api/reports/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!orderResponse.ok) throw new Error('Failed to fetch order report');
        const orderData = await orderResponse.json();
        setOrderReport(orderData);

        // Fetch User Activity Report
        const userActivityResponse = await fetch('http://localhost:5000/api/reports/user-activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!userActivityResponse.ok) throw new Error('Failed to fetch user activity report');
        const userActivityData = await userActivityResponse.json();
        setUserActivityReport(userActivityData);

        // Fetch Business Data (Simulated)
        // const businessResponse = await fetch('http://localhost:5000/api/reports/business-summary', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // if (!businessResponse.ok) throw new Error('Failed to fetch business summary');
        // const businessSummaryData = await businessResponse.json();
        // setBusinessData(businessSummaryData);

      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportToExcel = () => {
    const wb = utils.book_new();
    
    // Summary Sheet
    const summaryData = [['Metric', 'Value'],
      ['Revenue', salesReport?.totalRevenue || 0],
      ['Expenses', 0],
      ['Profit', salesReport?.totalProfit || 0],
      ['Loss', 0]];
    const ws = utils.aoa_to_sheet(summaryData);
    utils.book_append_sheet(wb, ws, 'Summary');

    // Transactions Sheet
    const transactionWs = utils.json_to_sheet(orderReport?.orders || []);
    utils.book_append_sheet(wb, transactionWs, 'Transactions');

    // Products Sheet
    const productsWs = utils.json_to_sheet(salesReport?.sales || []);
    utils.book_append_sheet(wb, productsWs, 'Products');

    writeFile(wb, 'business-report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Business Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text('Summary', 14, 30);
    
    doc.autoTable({
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Revenue', `$${salesReport?.totalRevenue?.toLocaleString() || 0}`],
        ['Expenses', `$0`],
        ['Profit', `$${salesReport?.totalProfit?.toLocaleString() || 0}`],
        ['Loss', `$0`]
      ]
    });
    
    doc.save('business-report.pdf');
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify({
      salesReport,
      inventoryReport,
      orderReport,
      userActivityReport
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'business-report.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading reports...</div>;
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700"
              >
                <option value="all">All Categories</option>
                <option value="sales">Sales</option>
                <option value="expenses">Expenses</option>
                <option value="inventory">Inventory</option>
              </select>
              <div className="flex space-x-2">
                <button onClick={exportToExcel} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </button>
                <button onClick={exportToPDF} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700">
                  <FilePdf className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button onClick={exportToJSON} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
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
                    <dd className="text-lg font-semibold text-gray-900">${salesReport?.totalRevenue?.toLocaleString() || 0}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                    <dd className="text-lg font-semibold text-gray-900">$0</dd>
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
                    <dd className="text-lg font-semibold text-green-600">${salesReport?.totalProfit?.toLocaleString() || 0}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Losses</dt>
                    <dd className="text-lg font-semibold text-red-600">$0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue & Profit Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Profit Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesReport?.sales}>
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
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Top Products */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesReport?.sales}>
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
          </div>

          {/* Revenue by Channel - Donut Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Channel</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesReport?.sales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="totalAmount"
                    nameKey="customerName"
                    label={({ name, value }) => `${name} ($${value?.toLocaleString()})`}
                  >
                    {salesReport?.sales?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expense Categories - Donut Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} ($${value?.toLocaleString()})`}
                >
                  {[]?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderReport?.orders?.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Order</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customerName}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600`}>
                      ${Math.abs(transaction.totalAmount).toLocaleString()}
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

        {/* Sales Report */}
        {salesReport && (
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">Sales Report</h2>
            <p>Total Revenue: ${salesReport.totalRevenue}</p>
            <p>Total Profit: ${salesReport.totalProfit}</p>
            {/* Display sales data as needed */}
          </div>
        )}

        {/* Inventory Report */}
        {inventoryReport && (
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">Inventory Report</h2>
            {inventoryReport.inventoryReport.map(item => (
              <div key={item.productId} className="mb-2">
                Product ID: {item.productId}, Stock Level: {item.stockLevel}
              </div>
            ))}
          </div>
        )}

        {/* Order Report */}
        {orderReport && (
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">Order Report</h2>
            <p>Total Orders: {orderReport.totalOrders}</p>
            <p>Total Order Value: ${orderReport.totalOrderValue}</p>
            {/* Display order data as needed */}
          </div>
        )}

        {/* User Activity Report */}
        {userActivityReport && (
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">User Activity Report</h2>
            {userActivityReport.userActivity.map(user => (
              <div key={user.userId} className="mb-2">
                {user.name} ({user.email}), Last Login: {user.lastLogin}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;