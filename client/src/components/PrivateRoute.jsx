import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');

  if (!token || !user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
