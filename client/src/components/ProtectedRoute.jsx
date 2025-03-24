import React, { useState, useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Modal from 'react-modal';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useContext(AuthContext); // Get isAuthenticated from context
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && (!user || !roles.includes(user.role))) {
      setIsModalOpen(true); // Open modal only when unauthorized
    } else {
      setIsModalOpen(false); // Close modal if authorized
    }
  }, [roles, user]);

  if (!isAuthenticated) {
    // Redirect to login and preserve the intended route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <div className={roles.length > 0 && (!user || !roles.includes(user.role)) ? 'blur-background' : ''}>
        {children}
      </div>
      {roles.length > 0 && (!user || !roles.includes(user.role)) && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-8 w-full max-w-md shadow-lg z-50"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
          ariaHideApp={false} // Prevent aria-hidden issues
        >
          <h2 className="text-2xl font-bold mb-4 text-red-600">Unauthorized Access</h2>
          <p className="text-gray-700 mb-6">You do not have permission to view this page.</p>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </Modal>
      )}
    </>
  );
};

export default ProtectedRoute;
