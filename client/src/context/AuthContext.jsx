import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const setAuthToken = (token) => {
    if (token) {
      // Store the token in sessionStorage or localStorage
      sessionStorage.setItem('authToken', token);
    } else {
      // Remove the token if not provided
      sessionStorage.removeItem('authToken');
    }
  };

  const getAuthToken = () => {
    return sessionStorage.getItem('authToken');
  };

  const signout = useCallback((callback) => {
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setAuthToken(null); // Clear the token
    navigate("/login");
    if (callback) callback();
  }, [navigate]);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ ...decoded, token });
        setIsAuthenticated(true);
        setAuthToken(token); // Store the token
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        setAuthToken(null); // Clear the token
        navigate("/login");
      }
    }
  }, [navigate, signout]);

  const signin = async (token, role, isFirstLogin, callback) => {
    try {
      const decoded = jwtDecode(token);
      
      // Store token in both sessionStorage and state
      sessionStorage.setItem('token', token);
      
      setUser({ ...decoded, token });
      setIsAuthenticated(true);
      
      // Debug logs
      console.log('Token stored:', token);
      console.log('User state updated:', decoded);

      if (callback) callback();
    } catch (error) {
      console.error('Signin error:', error);
      toast.error('Authentication failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      signin, 
      signout,
      getAuthToken // Expose the function to get the token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
