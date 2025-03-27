import React, { useState, useEffect } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import {
  DollarSign, TrendingUp, ShoppingBag, Users,
  ArrowUpRight, ArrowDownRight, Package
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState({
    salesData: [],
    ordersData: {
      completed: 0,
      pending: 0,
      processing: 0,
      cancelled: 0
    },
    expensesData: {
      totalExpenses: 0,
      lossPercentage: 0,
      loss: 0
    },
    revenueData: {
      totalRevenue: 0,
      profitPercentage: 0,
      profit: 0,
      netRevenue: 0
    },
    lowStockProducts: [],
    transactions: []
  });
  const [dateRange, setDateRange] = useState("monthly");
  const [topProducts, setTopProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analyticsMetadata, setAnalyticsMetadata] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.get("https://smart-inventory-application-1.onrender.com/api/dashboard/dashboard-data", {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: { dateRange },
        });
        
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [dateRange]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/products/top-performing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setTopProducts(data.topProducts);
        setRecommendations(data.recommendations);
        setAnalyticsMetadata(data.analyticsMetadata);
      } catch (error) {
        toast.error('Failed to fetch analytics: ' + error.message);
      }
    };

    fetchAnalytics();
  }, []);

  const salesChartConfig = {
    labels: data.salesData?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Sales",
        data: data.salesData?.map((item) => item.amount) || [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const ordersChartConfig = {
    labels: ["Completed", "Pending", "Processing", "Cancelled"],
    datasets: [
      {
        data: [
          data.ordersData?.completed ?? 0,
          data.ordersData?.pending ?? 0,
          data.ordersData?.processing ?? 0,
          data.ordersData?.cancelled ?? 0,
        ],
        backgroundColor: ["#4CAF50", "#FFC107", "#2196F3", "#F44336"],
      },
    ],
  };

  const revenueExpensesChartConfig = {
    labels: ["Revenue", "Expenses"],
    datasets: [
      {
        data: [
          data.revenueData?.totalRevenue ?? 0,
          data.expensesData?.totalExpenses ?? 0
        ],
        backgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const salesPerformanceData = topProducts.slice(0, 5).map(product => ({
    name: product.name,
    Sales: product.totalSold,
    Revenue: product.totalRevenue,
    Profit: product.totalProfit
  }));

  const renderProductAnalytics = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Product Performance Analytics</h2>
      
      {/* Sales Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Sales Performance</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Sales" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="Revenue" fill="#82ca9d" />
              <Bar yAxisId="right" dataKey="Profit" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Sales</th>
                  <th className="pb-2">Revenue</th>
                  <th className="pb-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 5).map((product) => (
                  <tr key={product._id} className="border-t">
                    <td className="py-2">{product.name}</td>
                    <td className="py-2">{product.totalSold}</td>
                    <td className="py-2">ksh {product.totalRevenue?.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={product.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ksh {product.totalProfit?.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Stock Recommendations</h3>
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{rec.name}</h4>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    rec.action === 'INCREASE_STOCK' ? 'bg-green-100 text-green-800' :
                    rec.action === 'REDUCE_STOCK' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rec.action}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Current Stock</p>
                    <p className="font-medium">{rec.metrics.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Daily Sales</p>
                    <p className="font-medium">{rec.metrics.avgDailySales.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Turnover Days</p>
                    <p className="font-medium">{rec.metrics.turnoverDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Metadata */}
      {analyticsMetadata && (
        <div className="text-sm text-gray-500 mt-4">
          Analysis period: {analyticsMetadata.periodAnalyzed} | 
          Products analyzed: {analyticsMetadata.totalProductsAnalyzed} | 
          Last updated: {new Date(analyticsMetadata.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 p-2 md:p-8 overflow-y-auto">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome to the dashboard!</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-green-100 p-2 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-lg font-semibold text-gray-800">Total Profits</h3>
            <p className="text-green-500 font-bold text-sm md:text-xl">
              ↑ {data.revenueData?.profitPercentage.toFixed(2) ?? 0}%
              <span className="block text-xs md:text-base">
                (ksh.{data.revenueData?.profit.toFixed(2) ?? 0})
              </span>
            </p>
          </div>
          <div className="bg-red-100 p-2 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-lg font-semibold text-gray-800">Total Loss</h3>
            <p className="text-red-500 font-bold text-sm md:text-xl">
              ↓ {data.expensesData?.lossPercentage.toFixed(2) ?? 0}%
              <span className="block text-xs md:text-base">
                (ksh.{data.expensesData?.loss.toFixed(2) ?? 0})
              </span>
            </p>
          </div>
          <div className="bg-blue-100 p-2 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-lg font-semibold text-gray-800">Total Spent</h3>
            <p className="text-sm md:text-xl">
              ksh.{data.expensesData?.totalExpenses.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="bg-yellow-100 p-2 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-lg font-semibold text-gray-800">Net Revenue</h3>
            <p className="text-sm md:text-xl">
              Ksh{data.revenueData?.netRevenue.toFixed(2) ?? 0}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-2 md:gap-4">
          <div className="bg-white p-2 md:p-4 rounded-lg shadow">
            <h2 className="text-sm md:text-xl font-semibold mb-2">Sales Overview</h2>
            <div className="h-[150px] md:h-[300px]">
              <Line 
                data={salesChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true },
                    x: { display: false }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-2 md:p-4 rounded-lg shadow">
            <h2 className="text-sm md:text-xl font-semibold mb-2">Orders Summary</h2>
            <div className="h-[150px] md:h-[300px]">
              <Doughnut 
                data={ordersChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { boxWidth: 10, font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-2 md:p-4 rounded-lg shadow">
            <h2 className="text-sm md:text-xl font-semibold mb-2">Revenue vs Expenses</h2>
            <div className="h-[150px] md:h-[300px]">
              <Doughnut 
                data={revenueExpensesChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { boxWidth: 10, font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-2 md:p-4 rounded-lg shadow">
            <h2 className="text-sm md:text-xl font-semibold mb-2">Low Stock Products</h2>
            <div className="h-[150px] md:h-[300px] overflow-y-auto">
              {data.lowStockProducts?.length > 0 ? (
                <ul className="list-disc pl-4 text-xs md:text-sm">
                  {data.lowStockProducts?.map((product) => (
                    <li key={product.id} className="text-red-500 mb-1">
                      {product.name} - {product.stock} left
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs md:text-sm">No products with low stock.</p>
              )}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <h2 className="text-sm md:text-xl font-semibold mb-2">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs md:text-sm">
                {data.transactions?.slice(0, 5).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">{transaction.id}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{transaction.user}</td>
                    <td className="px-2 py-2 whitespace-nowrap">ksh{transaction.amount}</td>
                  </tr>
                ))}
                {(!data.transactions || data.transactions.length === 0) && (
                  <tr>
                    <td colSpan="3" className="px-2 py-2 text-center text-gray-500">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Analytics */}
        {renderProductAnalytics()}
      </div>
    </div>
  );
};

export default Dashboard;