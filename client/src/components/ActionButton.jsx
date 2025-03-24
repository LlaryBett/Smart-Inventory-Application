import React from 'react';

const ActionButton = ({ label, icon: Icon, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg ${className}`}
  >
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {label}
  </button>
);

export default ActionButton;
