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

function Reports() {
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

        const salesResponse = await fetch('https://smart-inventory-application-1.onrender.com/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!salesResponse.ok) throw new Error('Failed to fetch reports');
        const allReportsData = await salesResponse.json();
        setSalesReport(allReportsData.salesReport);
        setInventoryReport(allReportsData.inventoryReport);
        setOrderReport(allReportsData.orderReport);
        setUserActivityReport(allReportsData.userActivityReport);

      } catch {
        console.error("Error fetching sales data:");
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

      const summaryData = [
        ['Metric', 'Value'],
        ['Revenue', salesReport?.totalRevenue || 0],
        ['Profit', salesReport?.totalProfit || 0],
        ['Total Orders', orderReport?.totalOrders || 0],
        ['Total Order Value', orderReport?.totalOrderValue || 0]
      ];
      const summaryWs = utils.aoa_to_sheet(summaryData);
      utils.book_append_sheet(wb, summaryWs, 'Summary');

      if (salesReport?.sales?.length) {
        const salesWs = utils.json_to_sheet(salesReport.sales);
        utils.book_append_sheet(wb, salesWs, 'Sales');
      }

      if (orderReport?.orders?.length) {
        const ordersWs = utils.json_to_sheet(orderReport.orders);
        utils.book_append_sheet(wb, ordersWs, 'Orders');
      }

      if (inventoryReport?.inventoryReport?.length) {
        const inventoryWs = utils.json_to_sheet(inventoryReport.inventoryReport);
        utils.book_append_sheet(wb, inventoryWs, 'Inventory');
      }

      if (userActivityReport?.userActivity?.length) {
        const userActivityWs = utils.json_to_sheet(userActivityReport.userActivity);
        utils.book_append_sheet(wb, userActivityWs, 'User Activity');
      }

      writeFile(wb, `business-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report downloaded successfully');
    } catch {
      toast.error('Failed to export Excel report');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(20);
      doc.text('Business Report', 14, yPos);
      yPos += 15;

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

  const inventoryChartData = inventoryReport?.inventoryReport?.map((item) => ({
    name: item.productId,
    stockLevel: item.stockLevel,
  })) || [];

  const ordersChartData = [
    { name: 'Completed', value: orderReport?.totalOrders || 0 },
    { name: 'Pending', value: 0 },
    { name: 'Cancelled', value: 0 },
  ];

  const salesChartData = salesReport?.sales?.map((sale) => ({
    name: sale.productName,
    amount: sale.totalAmount,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" />
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 py-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Business Reports</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-gray-700 w-full sm:w-auto"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={exportToExcel} 
                  className="inline-flex items-center px-2.5 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="inline-flex items-center px-2.5 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <FilePdf className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button 
                  onClick={exportToJSON} 
                  className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <FileJson className="h-4 w-4 mr-1" />
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-base font-semibold text-gray-900">ksh {salesReport?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-base font-semibold text-gray-900">{orderReport?.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-500">Net Profit</p>
                <p className="text-base font-semibold text-green-600">ksh {salesReport?.totalProfit?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-500">Total Order Value</p>
                <p className="text-base font-semibold text-gray-900">ksh {orderReport?.totalOrderValue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="text-base font-medium text-gray-900 mb-3">Revenue & Profit Overview</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <AreaChart data={salesReport?.sales || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="totalAmount" name="Revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="text-base font-medium text-gray-900 mb-3">Orders Overview</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={ordersChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ordersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="text-base font-medium text-gray-900 mb-3">Top Products</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <BarChart data={salesReport?.sales || []} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="totalAmount" name="Revenue" fill="#8884d8" />
                  <Bar dataKey="quantity" name="Sales" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="text-base font-medium text-gray-900 mb-3">Sales Overview</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <BarChart data={salesChartData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="amount" name="Sales Amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Inventory Levels</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={inventoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
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
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderReport?.orders?.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{transaction.createdAt}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{transaction.customerName}</td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 whitespace-nowrap">ksh {transaction.totalAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">
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

        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-base font-medium text-gray-900 mb-3">User Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userActivityReport?.userActivity?.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-3 py-2 text-sm text-gray-900">{user.userId}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{user.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{user.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">{user.lastLogin}</td>
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

export default Reports;