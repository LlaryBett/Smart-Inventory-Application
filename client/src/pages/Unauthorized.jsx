import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
      <p className="text-gray-700 mb-6">You do not have permission to view this page.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
