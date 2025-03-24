import React from 'react';
import { Shield, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedModal = ({ isOpen }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 mb-6">
            Sorry, you don't have permission to access this page. Only administrators can view and modify settings.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedModal;
