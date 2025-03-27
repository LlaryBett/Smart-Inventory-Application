import React from 'react';
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import signupImage from "../assets/signup.jpg";
import logoImage from "../assets/logo.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles
import Modal from "react-modal";
import ChangePasswordModal from '../components/ChangePasswordModal';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminCode: "",
    rememberMe: false
  }); // Removed role field as admin registration is fixed to admin role
  const [isRegister, setIsRegister] = useState(false); // Track form mode
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const authContext = useContext(AuthContext);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const validatePassword = (password) => {
    const validations = [
      { test: p => p.length >= 8, message: 'Password must be at least 8 characters long' },
      { test: p => /[A-Z]/.test(p), message: 'Must contain uppercase letter' },
      { test: p => /[a-z]/.test(p), message: 'Must contain lowercase letter' },
      { test: p => /\d/.test(p), message: 'Must contain number' },
      { test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'Must contain special character' }
    ];

    for (const validation of validations) {
      if (!validation.test(password)) {
        throw new Error(validation.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      try {
        // Validate admin registration
        if (!form.adminCode) {
          toast.error("Admin security code is required");
          return;
        }

        if (form.password !== form.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        try {
          validatePassword(form.password);
        } catch (error) {
          toast.error(error.message);
          return;
        }

        const response = await fetch("https://smart-inventory-application-1.onrender.com/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: "admin",
            adminCode: form.adminCode
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        toast.success("Admin account created successfully!");
        setIsRegister(false);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      try {
        const response = await fetch("https://smart-inventory-application-1.onrender.com/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        console.log('Login response:', data); // Debug log

        // Check if this is first login and user is not an admin
        if (data.isFirstLogin && data.user.role !== 'admin') {
          console.log('First time login detected'); // Debug log
          sessionStorage.setItem('tempToken', data.token);
          setShowPasswordModal(true);
          return; // Stop here - don't store credentials or navigate yet
        }

        // Normal login flow - user has already changed their password or is an admin
        const storage = form.rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(data.user));
        
        navigate('/dashboard');
        toast.success("Successfully logged in!");
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch("https://smart-inventory-application-1.onrender.com/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success("Password changed successfully!");
      setIsChangePasswordModalOpen(false);
      authContext.signout(() => {
        navigate("/login");
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePasswordChange = async (newPassword) => {
    try {
      const token = sessionStorage.getItem('tempToken');
      console.log('Using token for password change:', token);

      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Clear all tokens and storage
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      
      toast.success('Password changed successfully. Please login with your new password.');
      setShowPasswordModal(false);
      // Reset form but keep email for convenience
      setForm(prev => ({
        ...prev,
        password: '',
        rememberMe: false,
        confirmPassword: '',
        adminCode: ''
      }));

    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 h-screen items-center place-items-center">
      <div className="flex justify-center">
        <img src={signupImage} alt="Sign Up" />
      </div>
      <div className="w-full max-w-md space-y-8 p-10 rounded-lg">
        <div className="text-center">
          <img className="mx-auto h-12 w-auto" src={logoImage} alt="Your Company" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {isRegister ? "Create Admin Account" : "Sign in to your account"}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">Admin Security Code</label>
                  <input
                    id="adminCode"
                    name="adminCode"
                    type="password"
                    required
                    className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                    value={form.adminCode}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                placeholder="Email address"
                value={form.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                placeholder="Password"
                value={form.password}
                onChange={handleInputChange}
              />
            </div>
            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}
            {!isRegister && (
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={form.rememberMe}
                  onChange={handleInputChange}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600"
          >
            {isRegister ? "Register Admin Account" : "Sign in"}
          </button>
        </form>

        {!isRegister ? (
          <p className="mt-4 text-center text-sm text-gray-600">
            Are you an admin? {" "}
            <button 
              onClick={() => setIsRegister(true)} 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Register here
            </button>
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? {" "}
            <button 
              onClick={() => setIsRegister(false)} 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
      <ToastContainer /> {/* Add ToastContainer here */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onRequestClose={() => setIsChangePasswordModalOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-8 w-full max-w-md"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-2xl font-bold mb-6">Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="block w-full rounded-md border py-2 px-3 text-gray-900"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="block w-full rounded-md border py-2 px-3 text-gray-900"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full rounded-md border py-2 px-3 text-gray-900"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </div>
  );
};

export default Login;
