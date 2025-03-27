import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Users, ShoppingBag, Package, Settings, Power, 
  FileText, Truck, Receipt, Building2, Calendar, Menu, X 
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
  const { user, signout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signout(() => {
      navigate('/login');
    });
  };

  const NavItem = ({ to, icon: Icon, children }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center py-3 px-4 w-full ${
          isActive ? 'bg-indigo-700' : 'hover:bg-gray-800'
        }`
      }
    >
      <Icon className="h-5 w-5 min-w-[20px]" />
      <span className="hidden md:block ml-2 truncate">{children}</span>
    </NavLink>
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <img src={logoImage} alt="Logo" className="h-8 md:h-10" />
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        <NavItem to="/dashboard" icon={Home}>Dashboard</NavItem>
        {user?.role === 'admin' && <NavItem to="/users" icon={Users}>Users</NavItem>}
        <NavItem to="/products" icon={ShoppingBag}>Products</NavItem>
        <NavItem to="/orders" icon={Package}>Orders</NavItem>
        <NavItem to="/sales" icon={Receipt}>Sales</NavItem>
        <NavItem to="/purchases" icon={Truck}>Purchases</NavItem>
        <NavItem to="/services" icon={Building2}>Services</NavItem>
        <NavItem to="/reports" icon={FileText}>Reports</NavItem>
        <NavItem to="/calendar" icon={Calendar}>Calendar</NavItem>
        <NavItem to="/settings" icon={Settings}>Settings</NavItem>
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-red-700"
      >
        <Power className="h-5 w-5" />
        <span className="hidden md:block ml-2">Logout</span>
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-900 text-white"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-16 md:w-48 bg-gray-900 text-white shadow-lg flex-col transition-all duration-300 overflow-hidden">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-lg flex flex-col transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
