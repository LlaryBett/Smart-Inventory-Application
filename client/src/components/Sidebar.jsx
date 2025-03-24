import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, ShoppingBag, Package, Settings, Power, FileText, Truck, Receipt, Building2 } from 'lucide-react';
import logoImage from '../assets/logo.png';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
  const { user, signout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    signout(() => {
      navigate('/login');
    });
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 bg-gray-800">
        <img src={logoImage} alt="Logo" className="h-12" />
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Home className="h-5 w-5 mr-2" />
          Dashboard
        </NavLink>

        {/* Users */}
        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 ${
                isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
              }`
            }
          >
            <Users className="h-5 w-5 mr-2" />
            Users
          </NavLink>
        )}

        {/* Products */}
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <ShoppingBag className="h-5 w-5 mr-2" />
          Products
        </NavLink>

        {/* Orders */}
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Package className="h-5 w-5 mr-2" />
          Orders
        </NavLink>

        {/* Sales */}
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Receipt className="h-5 w-5 mr-2" />
          Sales
        </NavLink>

        {/* Purchases */}
        <NavLink
          to="/purchases"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Truck className="h-5 w-5 mr-2" />
          Purchases
        </NavLink>

        {/* Services */}
        <NavLink
          to="/services"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Building2 className="h-5 w-5 mr-2" />
          Services
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <FileText className="h-5 w-5 mr-2" />
          Reports
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center py-3 px-6 ${
              isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
            }`
          }
        >
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </NavLink>
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute bottom-0 left-0 w-full flex items-center py-3 px-6 bg-gray-800 hover:bg-red-700"
      >
        <Power className="h-5 w-5 mr-2" />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
