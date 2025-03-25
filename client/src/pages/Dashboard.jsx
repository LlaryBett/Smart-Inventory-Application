import React, { useState, useEffect } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import "chart.js/auto"; // Automatically registers Chart.js components
import axios from "axios";

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

  // Fetch data from the backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.get("http://localhost:5000/api/dashboard/dashboard-data", {
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

  // Chart configurations
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p>Welcome to the dashboard!</p>
      <div className="dashboard-container p-6 bg-gray-100 min-h-screen">
        {/* Top Section - KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card bg-green-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Total Profits</h3>
            <p className="text-green-500 font-bold text-xl">
              ↑ {data.revenueData?.profitPercentage.toFixed(2) ?? 0}% (ksh.{data.revenueData?.profit.toFixed(2) ?? 0})
            </p>
          </div>
          <div className="card bg-red-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Total Loss</h3>
            <p className="text-red-500 font-bold text-xl">
              ↓ {data.expensesData?.lossPercentage.toFixed(2) ?? 0}% (ksh.{data.expensesData?.loss.toFixed(2) ?? 0})
            </p>
          </div>
          <div className="card bg-blue-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Total Spent</h3>
            <p className="text-xl">ksh.{data.expensesData?.totalExpenses.toFixed(2) ?? 0}</p>
          </div>
          <div className="card bg-yellow-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Net Revenue</h3>
            <p className="text-xl">Ksh{data.revenueData?.netRevenue.toFixed(2) ?? 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex justify-end">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-300 rounded px-4 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Sales Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
          <Line data={salesChartConfig} />
        </div>

        {/* Orders Overview */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Orders Summary</h2>
            <Doughnut data={ordersChartConfig} />
          </div>

          {/* Revenue vs Expenses */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Revenue vs Expenses</h2>
            <Doughnut data={revenueExpensesChartConfig} />
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
          {data.lowStockProducts?.length > 0 ? (
            <ul className="list-disc pl-6">
              {data.lowStockProducts?.map((product) => (
                <li key={product.id} className="text-red-500">
                  {product.name} - {product.stock} left
                </li>
              ))}
            </ul>
          ) : (
            <p>No products with low stock.</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <table className="table-auto w-full bg-white shadow rounded overflow-hidden">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="px-4 py-2">Transaction ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions &&
                data.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-2">{transaction.id}</td>
                    <td className="px-4 py-2">{transaction.user}</td>
                    <td className="px-4 py-2">ksh{transaction.amount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
