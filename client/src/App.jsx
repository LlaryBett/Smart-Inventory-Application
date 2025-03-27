import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Product";
import Orders from "./pages/Order";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Services from "./pages/Services";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Reports from './pages/Reports';
import Unauthorized from './pages/Unauthorized'; // Import Unauthorized page
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import CalendarPage from './pages/Calendar'; // Import Calendar page

const App = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const showSidebar = location.pathname !== "/login";

  return (
    <div className="flex">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 p-4 ${showSidebar ? "lg:ml-64" : ""}`}>
        <Routes>
          {/* Redirect root to dashboard if logged in, otherwise to login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} /> {/* Add Unauthorized route */}

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute roles={['admin', 'cashier-out']}>
              <Sales />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/purchases" element={
            <ProtectedRoute>
              <Purchases />
            </ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute roles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default App;
