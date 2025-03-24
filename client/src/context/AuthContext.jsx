import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode"; // Default import
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  signin: () => {},
  signout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Add isAuthenticated state
  const navigate = useNavigate();

  const signout = useCallback((callback) => {
    setIsAuthenticated(false); // Update isAuthenticated state
    setUser(null);
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    navigate("/login");
    if (callback) callback();
  }, [navigate]);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token); // Correct usage: calling the default import
        setUser({ ...decoded, token });
        setIsAuthenticated(true); // Set isAuthenticated to true
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsAuthenticated(false); // Ensure isAuthenticated is set to false on error
        setUser(null); // Clear user data
        sessionStorage.removeItem('token'); // Clear token
        localStorage.removeItem('token'); // Clear token
        navigate("/login"); // Redirect to login
      }
    }
  }, [navigate, signout]);

  const signin = async (token, role, isFirstLogin, callback) => {
    try {
      const decoded = jwtDecode(token); // Correct usage: calling the default import
      setUser({ ...decoded, token, role, isFirstLogin });
      setIsAuthenticated(true); // Set isAuthenticated to true
      sessionStorage.setItem('token', token);
      if (callback) callback();
    } catch (error) {
      console.error('Signin error:', error);
      toast.error('Authentication failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, // Include isAuthenticated in the context
      signin, 
      signout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
