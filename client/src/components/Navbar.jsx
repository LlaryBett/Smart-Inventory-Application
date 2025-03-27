import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">Smart Appl</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
          <Link to="/reports" className="text-gray-300 hover:text-white">Reports</Link>
          <Link to="/calendar" className="text-gray-300 hover:text-white">Calendar</Link>
          <Link to="/settings" className="text-gray-300 hover:text-white">Settings</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
