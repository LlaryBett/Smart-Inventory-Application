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
          }
        });
        
        console.log('Raw API response:', response.data);
        setData(response.data);
        console.log('Updated dashboard state:', response.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to fetch dashboard data");
      }
    };

    fetchData();
  }, []);

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
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Product Performance Analytics</h2>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Sales Performance</h3>
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#8884d8"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#82ca9d"
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="Sales" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="Revenue" fill="#82ca9d" />
              <Bar yAxisId="right" dataKey="Profit" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-base md:text-lg font-semibold mb-4">Top Performing Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs md:text-sm font-medium text-gray-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Sales</th>
                  <th className="pb-2">Revenue</th>
                  <th className="pb-2">Profit</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
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

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-base md:text-lg font-semibold mb-4">Stock Recommendations</h3>
          <div className="space-y-4 overflow-y-auto max-h-[400px]">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm md:text-base">{rec.name}</h4>
                    <p className="text-xs md:text-sm text-gray-600">{rec.reason}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs md:text-sm font-medium ${
                    rec.action === 'INCREASE_STOCK' ? 'bg-green-100 text-green-800' :
                    rec.action === 'REDUCE_STOCK' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rec.action}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
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

      {analyticsMetadata && (
        <div className="text-xs md:text-sm text-gray-500 mt-4">
          Analysis period: {analyticsMetadata.periodAnalyzed} | 
          Products analyzed: {analyticsMetadata.totalProductsAnalyzed} | 
          Last updated: {new Date(analyticsMetadata.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6 overflow-y-auto">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs md:text-sm text-gray-600">Welcome to the dashboard!</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-green-100 p-3 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-base font-semibold text-gray-800">Total Profits</h3>
            <p className="text-green-500 font-bold text-sm md:text-lg">
              ↑ {data.revenueData?.profitPercentage.toFixed(2) ?? 0}%
              <span className="block text-xs">
                (ksh.{data.revenueData?.profit.toFixed(2) ?? 0})
              </span>
            </p>
          </div>
          <div className="bg-red-100 p-3 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-base font-semibold text-gray-800">Total Loss</h3>
            <p className="text-red-500 font-bold text-sm md:text-lg">
              ↓ {data.expensesData?.lossPercentage.toFixed(2) ?? 0}%
              <span className="block text-xs">
                (ksh.{data.expensesData?.loss.toFixed(2) ?? 0})
              </span>
            </p>
          </div>
          <div className="bg-blue-100 p-3 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-base font-semibold text-gray-800">Total Spent</h3>
            <p className="text-sm md:text-lg">
              ksh.{data.expensesData?.totalExpenses.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="bg-yellow-100 p-3 md:p-4 rounded-lg shadow">
            <h3 className="text-xs md:text-base font-semibold text-gray-800">Net Revenue</h3>
            <p className="text-sm md:text-lg">
              Ksh{data.revenueData?.netRevenue.toFixed(2) ?? 0}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-base md:text-lg font-semibold mb-4">Sales Overview</h2>
            <div className="h-[200px] md:h-[300px]">
              <Line 
                data={salesChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { 
                      beginAtZero: true,
                      ticks: { font: { size: 10 } }
                    },
                    x: { 
                      display: false,
                      ticks: { font: { size: 10 } }
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-base md:text-lg font-semibold mb-4">Orders Summary</h2>
            <div className="h-[200px] md:h-[300px]">
              <Doughnut 
                data={ordersChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { 
                        boxWidth: 10, 
                        font: { size: 10 },
                        padding: 10
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-base md:text-lg font-semibold mb-4">Revenue vs Expenses</h2>
            <div className="h-[200px] md:h-[300px]">
              <Doughnut 
                data={revenueExpensesChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { 
                        boxWidth: 10, 
                        font: { size: 10 },
                        padding: 10
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-base md:text-lg font-semibold mb-4">Low Stock Products</h2>
            <div className="h-[200px] md:h-[300px] overflow-y-auto">
              {data.lowStockProducts?.length > 0 ? (
                <ul className="list-disc pl-4 text-xs md:text-sm space-y-2">
                  {data.lowStockProducts?.map((product) => (
                    <li key={product.id} className="text-red-500">
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

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-base md:text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs md:text-sm">
                {data.transactions?.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      {transaction.id?.split('-').slice(-1)[0]}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {transaction.user || 'Anonymous'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      ksh {transaction.amount?.toLocaleString()}
                    </td>
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

        {renderProductAnalytics()}
      </div>
    </div>
  );
};

export default Dashboard;